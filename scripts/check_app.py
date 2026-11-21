"""Run browser checks against the production build without starting a server."""
from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import mimetypes
import json
import os

DIST = Path('dist').resolve()
ART = Path('artifacts'); ART.mkdir(exist_ok=True)
errors=[]

def serve(route):
    url=route.request.url.split('http://atlas.test',1)[-1].split('?',1)[0]
    path=DIST/url.lstrip('/')
    if not url.strip('/') or url in ['/harta','/cartiere','/salvate']:
        path=DIST/'index.html'
    if url.startswith('/api/atlas'):
        route.fulfill(json={'configured':False,'adminConfigured':False,'locations':[],'events':[],'deleted':[],'reports':[]});return
    if not path.is_file():
        route.fulfill(status=404,body='Not found');return
    route.fulfill(status=200,body=path.read_bytes(),content_type=mimetypes.guess_type(path.name)[0] or 'application/octet-stream')

with sync_playwright() as p:
    b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    ctx=b.new_context(viewport={'width':1440,'height':900},device_scale_factor=1)
    # Isolate the production application from the hosting preview's CDN telemetry.
    ctx.route('https://**/*',lambda r:r.fulfill(status=200,body='',content_type='application/javascript'))
    ctx.route('http://atlas.test/**',serve)
    page=ctx.new_page(); page.on('pageerror',lambda x:errors.append(str(x)))
    page.goto('http://atlas.test/harta',wait_until='networkidle');page.evaluate('document.fonts.ready');page.wait_for_timeout(550)
    page.screenshot(path=str(ART/'desktop.png'))
    print('Desktop title:',page.title(),'pins:',page.locator('.map-pin').count(),'rows:',page.locator('.place-row').count())
    total_places=page.locator('.place-row').count()
    broken_images=page.locator('img').evaluate_all('(arr) => arr.filter(i=>i.complete && !i.naturalWidth).map(i=>i.src)')
    print('Broken images (offscreen lazy images excluded):',broken_images);assert not broken_images
    print('Layout:',page.evaluate('Object.fromEntries([".atlas-map",".panel-intro",".place-popup",".map-pin",".places-list"].map(s=>{let r=document.querySelector(s).getBoundingClientRect();return [s,[r.x,r.y,r.width,r.height]]}))'))
    page.set_viewport_size({'width':1280,'height':760});page.wait_for_timeout(200);page.screenshot(path=str(ART/'desktop-compact.png'))
    page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(250);page.screenshot(path=str(ART/'mobile.png'))
    page.get_by_role('button',name='Listă de locuri').click();page.screenshot(path=str(ART/'mobile-list.png'))
    print('No horizontal overflow:',page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'))
    # The small-screen list opens a real place, then returns to its map marker.
    page.get_by_role('button',name='Arată Parcul Cetății pe hartă').click();page.wait_for_timeout(420)
    assert page.locator('.place-popup h2').inner_text()=='Parcul Cetății'
    assert page.locator('.guide-layout').get_attribute('data-mobile-view')=='map'
    page.get_by_role('button',name='Vezi detalii',exact=True).click()
    assert page.get_by_role('dialog').is_visible()
    assert 'destination=45.885781,22.899612' in page.get_by_role('link',name='Indicații de orientare').get_attribute('href')
    page.keyboard.press('Escape');assert page.get_by_role('dialog').count()==0
    # Saved collections are persisted and can also be emptied.
    page.set_viewport_size({'width':1440,'height':900});page.wait_for_timeout(200)
    page.get_by_role('button',name='Salvează Parcul Cetății',exact=True).click()
    page.get_by_role('link',name='Locuri salvate',exact=True).click()
    expect(page.locator('.place-row')).to_have_count(1);expect(page.locator('.map-pin')).to_have_count(1)
    page.reload(wait_until='networkidle');assert page.locator('.place-row').count()==1
    page.wait_for_timeout(420)
    page.get_by_role('button',name='Elimină Parcul Cetății din locurile salvate',exact=True).click()
    assert page.locator('.empty-state').is_visible() and page.locator('.place-row').count()==0
    page.get_by_role('button',name='Explorează locurile',exact=True).click();page.wait_for_timeout(420)
    # Search works without diacritics and provides a reversible empty state.
    search=page.get_by_role('searchbox');search.fill('parcul cetatii');assert page.locator('.place-row').count()==1
    search.fill('does-not-exist-xyz');assert page.locator('.map-pin').count()==0
    page.get_by_role('button',name='Resetează filtrele').click();assert page.locator('.place-row').count()==total_places
    for cat,count in [('Cultură',4),('Natură',6),('Arhitectură',1),('Transport',1),('Istorie',1),('Magazine',18),('Gastronomie',7),('Cazare',3),('Servicii',6),('Instituții',1),('Toate',total_places)]:
        page.locator('.category-filters').get_by_role('button',name=cat,exact=True).click();assert page.locator('.map-pin').count()==count
    page.wait_for_timeout(420)
    # Native zoom, drag, keyboard controls, and center reset.
    before=page.locator('.map-ground').get_attribute('style')
    page.get_by_role('button',name='Mărește harta',exact=True).click();page.wait_for_timeout(420)
    assert page.locator('.map-ground').get_attribute('style') != before
    page.get_by_role('button',name='Micșorează harta',exact=True).click();page.wait_for_timeout(420)
    page.mouse.move(1200,450);page.mouse.down();page.mouse.move(1270,490,steps=10);page.mouse.up()
    assert page.locator('.map-ground').get_attribute('style') != before
    page.get_by_role('button',name='Recentrează harta',exact=True).click();page.wait_for_timeout(420)
    home=page.locator('.map-ground').get_attribute('style');page.locator('.atlas-map').focus();page.keyboard.press('ArrowLeft');page.wait_for_timeout(420)
    assert page.locator('.map-ground').get_attribute('style') != home
    page.keyboard.press('Home');page.wait_for_timeout(420)
    # Layer toggles, legend, credits, and all six place detail cards.
    page.get_by_role('button',name='Straturi',exact=True).click();page.get_by_role('button',name='Stradală',exact=True).click()
    assert 'street-view' in page.locator('.atlas-map').get_attribute('class')
    page.get_by_role('switch',name='Denumiri pe hartă').click();assert page.locator('img[src="/map/labels.svg"]').count()==0
    page.get_by_role('switch',name='Denumiri pe hartă').click();page.get_by_role('button',name='Topografică',exact=True).click();page.get_by_role('button',name='Straturi',exact=True).click()
    page.get_by_role('button',name='Legendă',exact=True).click();assert page.locator('.legend-item').count()==10
    page.get_by_role('button',name='Închide legenda').click();page.get_by_role('button',name='Despre atlas',exact=True).click()
    page.get_by_role('button',name='Surse și credite',exact=True).click();assert page.locator('.source-content li').count()==9
    page.keyboard.press('Escape')
    for i in range(6):
        row=page.locator('.place-row').nth(i);name=row.locator('.row-name').inner_text();row.click();page.wait_for_timeout(400)
        assert page.locator('.place-popup h2').inner_text()==name
        page.get_by_role('button',name='Vezi detalii',exact=True).click();assert page.locator('#detail-title').inner_text()==name
        page.get_by_role('button',name='Închide fereastra',exact=True).click()
    page.get_by_role('button',name='Recentrează harta',exact=True).click();page.wait_for_timeout(420)
    page.get_by_role('button',name='Selectează Cetatea Devei',exact=True).click();assert page.locator('.place-popup h2').inner_text()=='Cetatea Devei'
    # Named but unverified local places are findable, never assigned fabricated coordinates.
    for n in ['Dealul 1000','La 700']:
        search.fill(n);assert page.locator('.map-pin').count()==0
        page.locator('.local-names').get_by_role('button',name=n,exact=False).click();assert page.get_by_role('dialog').get_by_text('Localizare neconfirmată',exact=True).is_visible()
        assert page.get_by_role('dialog').get_by_role('link',name='Indicații de orientare').count()==0;page.keyboard.press('Escape')
    search.fill('Padurea Bejan');page.get_by_role('button',name='Arată Pădurea Bejan pe hartă',exact=True).click();page.wait_for_timeout(440);assert page.locator('.place-popup h2').inner_text()=='Pădurea Bejan'
    page.get_by_role('button',name='Vezi detalii',exact=True).click();assert page.locator('.place-sources a').count()==2;page.keyboard.press('Escape')
    page.get_by_role('link',name='Cartiere',exact=True).click();page.wait_for_timeout(430)
    page.get_by_role('button',name='Cartier: Micro 15',exact=True).click();page.wait_for_timeout(450)
    assert page.locator('.district-outline path').count()==1 and page.locator('.district-pop').get_by_text('8.179',exact=False).count()>0
    assert page.locator('.district-inventory').get_by_role('button',name='Piața Cioclovina').count()==1
    page.screenshot(path=str(ART/'district-micro15.png'))
    page.get_by_role('button',name='Toate cartierele',exact=True).click();page.get_by_role('button',name='Explorează cartierul Centrul Vechi',exact=True).click();page.wait_for_timeout(430)
    assert page.locator('.district-outline').count()==0 and 'fără contur' in page.locator('.geo-status').inner_text()
    assert 'Neevaluată' in page.locator('.district-safety').inner_text()
    page.get_by_role('button',name='Alege nivelul de zoom',exact=True).click();slider=page.get_by_role('slider');slider.focus();slider.press('End');page.wait_for_timeout(150)
    assert page.get_by_role('button',name='Mărește harta',exact=True).is_disabled()
    slider.press('Home');page.wait_for_timeout(150);assert page.get_by_role('button',name='Micșorează harta',exact=True).is_disabled()
    page.keyboard.press('Escape');page.get_by_role('link',name='Hartă interactivă',exact=True).click()
    # Touch-sized layout also fits narrow devices.
    page.set_viewport_size({'width':320,'height':640});page.wait_for_timeout(150)
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    print('PASS: responsive layout, six detail sheets, navigation links, search, all category filters, map panning/zoom, layers, saved-place persistence, modal keyboard access, source credits.')
    print('Browser errors:',errors);assert not errors
    b.close()
