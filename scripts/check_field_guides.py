"""Check the new documented field guides and historical sheet against dist/ (no server)."""
import json
import mimetypes
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

ROOT = Path('dist').resolve()
BASE = 'https://atlas.test'
errors = []
def serve(route):
    path = urlsplit(route.request.url).path
    if path == '/api/atlas':
        route.fulfill(json={'configured':False,'adminConfigured':False,'locations':[],'events':[],'reports':[],'deleted':[]}); return
    f = ROOT / path.lstrip('/')
    if not f.is_file():
        if Path(path).suffix: route.fulfill(status=404,body='Not found'); return
        f = ROOT/'index.html'
    route.fulfill(body=f.read_bytes(), content_type=mimetypes.guess_type(f.name)[0] or 'application/octet-stream')

with sync_playwright() as pw:
    browser = pw.chromium.launch(args=['--no-sandbox','--disable-dev-shm-usage'])
    ctx = browser.new_context(viewport={'width':1440,'height':900})
    ctx.route('https://**/*', lambda r:r.fulfill(status=200,body='',content_type='application/javascript'))
    ctx.route(BASE+'/**', serve)
    page=ctx.new_page(); page.set_default_timeout(6500)
    page.on('pageerror', lambda e:errors.append(str(e)))
    visit=lambda path:page.goto(BASE+path,wait_until='networkidle')
    visit('/ghiduri'); page.screenshot(path='artifacts/ghiduri-locale.png')
    expect(page.locator('.field-card')).to_have_count(8)
    for topic,count in [('Sate',2),('Arheologie',2),('Minerit',2),('Cariere',1),('Parcuri',2),('Viață civică',1),('Toate',8)]:
        page.get_by_role('group',name='Temele ghidurilor').get_by_role('button',name=topic,exact=True).click()
        expect(page.locator('.field-card')).to_have_count(count)
    page.get_by_role('searchbox',name='Caută în ghiduri').fill('micia');expect(page.locator('.field-card')).to_have_count(1)
    page.get_by_role('button',name='Salvează pentru lectură: Micia, pe frontiera Daciei romane').click()
    page.reload(wait_until='networkidle');expect(page.locator('.field-card .card-save')).to_have_attribute('aria-pressed','true')
    page.get_by_role('searchbox').fill('inexistent-xyz');expect(page.locator('.field-card')).to_have_count(0)
    page.get_by_role('button',name='Arată toate ghidurile').click();page.get_by_role('button',name='Lecturi salvate 1').click();expect(page.locator('.field-card')).to_have_count(1)
    page.get_by_role('link',name='Citește ghidul').click();expect(page.locator('.field-bibliography a')).to_have_count(3)
    page.get_by_role('button',name='Cum sunt alese sursele?').click();expect(page.get_by_role('dialog')).to_be_visible();page.keyboard.press('Escape')
    page.evaluate('window.print = () => { window.__didPrint = true }');page.get_by_role('button',name='Tipărește fișa').click();assert page.evaluate('window.__didPrint')
    page.emulate_media(media='print');assert not page.locator('.city-rail').is_visible();page.emulate_media(media='screen')
    for slug in ['satele-devei','magura-uroiului','minele-de-arama','muncelu-mic','arboretum-simeria','parcurile-devei','primarul-devei']:
        visit('/ghiduri/'+slug);expect(page.locator('.field-article-head h1')).to_be_visible();assert page.locator('.field-bibliography a').count()>=2
        links=page.locator('.ref-links a, .field-bibliography a').evaluate_all('(a)=>a.map(x=>x.href)');assert all(a.startswith('https://') for a in links)
        assert page.locator('figure img').evaluate('e=>e.naturalWidth>0')
    expect(page.locator('.field-article-head')).to_contain_text('Lucian Ioan Rus')
    visit('/ghiduri/harta-iosefina');expect(page.locator('.sheet-mount img')).to_be_visible();expect(page.locator('output')).to_have_text('100%')
    assert page.locator('.sheet-mount img').evaluate('e=>e.naturalWidth === 3400')
    page.get_by_role('button',name='Mărește planșa').click();expect(page.locator('output')).to_have_text('150%')
    page.get_by_role('button',name='Deva și cetatea',exact=True).click();expect(page.locator('output')).to_have_text('360%')
    assert page.locator('.sheet-viewport').evaluate('e=>e.scrollLeft>0 && e.scrollTop>0')
    page.locator('.sheet-viewport').focus();page.keyboard.press('-');expect(page.locator('output')).to_have_text('240%')
    page.get_by_role('button',name='Valea Mureșului',exact=True).click();page.get_by_role('button',name='Încadrează planșa completă').click();expect(page.locator('output')).to_have_text('100%')
    expect(page.locator('.archive-documentation')).to_contain_text('B IX 715');page.screenshot(path='artifacts/harta-iosefina.png')
    page.keyboard.press('Control+k');page.get_by_label('Caută în tot atlasul').fill('Lucian Ioan Rus');expect(page.locator('.global-results a')).to_have_count(1);page.keyboard.press('Enter');expect(page.locator('.field-article-head')).to_contain_text('primarul municipiului Deva')
    visit('/harta');page.get_by_role('button',name='Straturi',exact=True).click();page.locator('.map-archive-link').click();expect(page.locator('.sheet-viewport')).to_be_visible()
    visit('/business?tip=Magazine');expect(page.locator('.city-place-card')).to_have_count(18)
    page.get_by_role('searchbox',name='Caută o afacere').fill('Decathlon');expect(page.locator('.city-place-card')).to_have_count(1);page.get_by_role('link',name='Decathlon Deva',exact=True).click();expect(page.locator('.profile-facts')).to_contain_text('Calea Zarandului, nr. 87');assert page.locator('.fact-sources a').first.get_attribute('href').endswith('/node/6579711229')
    page.get_by_role('link',name='Vezi pe hartă',exact=True).click();expect(page.locator('.place-popup h2')).to_have_text('Decathlon Deva')
    for w,h in [(390,844),(320,640),(820,1050)]:
        page.set_viewport_size({'width':w,'height':h});visit('/ghiduri');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        page.locator('.archive-feature').click();expect(page.locator('.sheet-viewport')).to_be_visible();page.get_by_role('button',name='Mărește planșa').click();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        if w==390:page.screenshot(path='artifacts/harta-iosefina-mobile.png')
    assert not errors, errors
    print('PASS: 10 additional shops; 8 cited guides; 6 topics; reading list, keyboard search, regional links, print view, civil information, archive provenance, scan pan/zoom/reset, responsive layouts and crossing back to the existing map.')
    browser.close()
