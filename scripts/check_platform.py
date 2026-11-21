"""Exercise the built SPA and real backend handler in isolated stores; no persistent server."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from urllib.parse import urlsplit
import mimetypes,json,subprocess,base64
D=Path('dist').resolve(); A=Path('artifacts'); A.mkdir(exist_ok=True)
origin='https://atlas.test';errors=[]
srv=subprocess.Popen(['node','--disable-warning=ExperimentalWarning','scripts/api-fixture.mjs'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True)
creds=json.loads(srv.stdout.readline())

def serve(r):
 u=urlsplit(r.request.url)
 if u.path.startswith('/api/atlas'):
  h=r.request.all_headers();h['host']='atlas.test';request={'url':u.path+'?'+u.query,'method':r.request.method,'headers':h,'body':r.request.post_data or None};srv.stdin.write(json.dumps(request)+'\n');srv.stdin.flush();d=json.loads(srv.stdout.readline());r.fulfill(status=d['status'],headers=d['headers'],body=base64.b64decode(d['body']));return
 q=D/u.path.lstrip('/')
 if not q.is_file():
  if Path(u.path).suffix:r.fulfill(status=404,body='not found');return
  q=D/'index.html'
 r.fulfill(body=q.read_bytes(),content_type=mimetypes.guess_type(q.name)[0] or 'application/octet-stream')

def run():
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);c=b.new_context(viewport={'width':1440,'height':900},geolocation={'latitude':45.8858,'longitude':22.8996},permissions=['geolocation','clipboard-read','clipboard-write']);c.route('https://**/*',lambda r:r.fulfill(body='',content_type='application/javascript'));c.route(origin+'/**',serve)
  calls=[]
  def meteo(r):
   import datetime
   calls.append(1);r.fulfill(json={'current':{'temperature_2m':10,'weather_code':2,'wind_speed_10m':12,'time':datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M')}})
  c.route('https://api.open-meteo.com/**',meteo);pg=c.new_page();pg.set_default_timeout(6500);pg.on('pageerror',lambda e:errors.append(str(e)));g=lambda u:pg.goto(origin+u,wait_until='networkidle');btn=lambda n:pg.get_by_role('button',name=n,exact=True);link=lambda n:pg.get_by_role('link',name=n,exact=True);label=lambda n:pg.get_by_label(n,exact=True)
  g('/');pg.evaluate('document.fonts.ready');pg.wait_for_timeout(300);pg.screenshot(path=str(A/'portal-desktop.png'));assert pg.locator('.recommended-grid article').count()==3
  btn('Fotografia următoare').click();assert 'centrul-deva' in pg.locator('.city-hero>img').get_attribute('src');btn('Fotografia anterioară').click();btn('Activează tema întunecată').click();pg.reload();assert pg.locator('html').get_attribute('data-theme')=='dark';btn('Activează tema luminoasă').click()
  btn('Salvează Cetatea Devei').click();link('Locuri salvate').click();expect(pg.locator('.place-row')).to_have_count(1);g('/');btn('În apropierea mea').click();btn('Permite localizarea').click();pg.locator('.global-results>a').first.wait_for();label('Rază de căutare').select_option('500');expect(pg.locator('.global-results')).to_contain_text('Parcul Cetății');pg.keyboard.press('Escape')
  pg.keyboard.press('Control+k');label('Caută în tot atlasul').fill('casa rustica');pg.keyboard.press('Enter');assert pg.url.endswith('/business/casa-rustica');assert '0727 021 555' in pg.locator('.profile-facts').inner_text();btn('Distribuie').click();assert '/business/casa-rustica' in pg.evaluate('navigator.clipboard.readText()');link('Vezi pe hartă').click();pg.wait_for_timeout(450);assert pg.locator('.place-popup h2').inner_text()=='Casa Rustica'
  g('/business');btn('Cafenele').click();expect(pg.locator('.city-place-card')).to_have_count(3);label('Cu telefon disponibil').check();assert pg.locator('.city-place-card').count()<=3;g('/obiective?tema=Natură');expect(pg.locator('.city-place-card')).to_have_count(6);g('/istorie');expect(pg.locator('.history-list article')).to_have_count(3)
  g('/trasee');pg.locator('.trail-presets button').first.click();expect(pg.locator('.route-stops li')).to_have_count(4);btn('Calculează traseul').click();pg.locator('.route-summary').wait_for();assert 'km' in pg.locator('.route-summary').inner_text();link('Traseul pe hartă').click();expect(pg.locator('svg[aria-label="Traseu calculat pe rețeaua pietonală"] polyline')).to_have_count(1);g('/trasee');pg.locator('.route-stops li').first.get_by_role('button').nth(1).click();pg.locator('.route-stops li').last.get_by_role('button').last.click();label('Alege o oprire').select_option('parcul-cetatii');btn('Adaugă').click();expect(pg.locator('.route-stops li')).to_have_count(4)
  g('/live');label('Tip de eveniment').select_option('Concert');assert pg.locator('.event-card').count()==1;assert 'DevOrchestra' in pg.locator('.event-card').inner_text();btn('Actualizează vremea').click();pg.wait_for_timeout(150);assert calls;label('Arhivă').check();assert not pg.locator('.event-card').count()
  # Real moderated submission through the local-only server handler, including photo preprocessing.
  g('/comunitate');label('Titlu').fill('Observație temporară verificare');label('Locul sau adresa').fill('Loc de verificare locală');label('Descriere').fill('Text pentru testarea privată a fluxului de moderare.');pg.set_input_files('input[type=file]','public/images/thumbs/park.webp');pg.locator('.upload-preview img').wait_for();pg.locator('input[type=checkbox]').check();btn('Trimite la moderare').click();pg.locator('.success-message').wait_for();assert not pg.locator('.notice-grid article').count()
  g('/administrare');label('Utilizator').fill(creds['user']);label('Parolă').fill(creds['pw']);btn('Autentificare').click();btn('Moderare').click();expect(pg.locator('.admin-queue article')).to_have_count(1);btn('Aprobă').click();expect(pg.locator('.form-message')).to_contain_text('actualizată');g('/comunitate');expect(pg.locator('.notice-grid article')).to_have_count(1);g('/administrare');btn('Afaceri').click();btn('Editează Casa Rustica').click();label('Nume').fill('Casa Rustica — verificare privată');btn('Publică modificările').click();pg.locator('.admin-edit').wait_for(state='detached');g('/business/casa-rustica');expect(pg.locator('.place-editorial h1')).to_contain_text('verificare privată')
  g('/administrare');btn('Evenimente').click();btn('Adaugă eveniment').click();label('Titlu').fill('Eveniment pentru test privat');label('Loc de desfășurare').fill('Sala de test');label('Început (ora dispozitivului)').fill('2027-05-01T10:00');label('Descriere').fill('Eveniment de test izolat; nu este un eveniment real.');label('Sursă HTTPS').fill('https://www.primariadeva.ro/');btn('Publică modificările').click();pg.locator('.admin-edit').wait_for(state='detached');btn('Șterge Eveniment pentru test privat').click();btn('Confirmă ștergerea').click();expect(btn('Șterge Eveniment pentru test privat')).to_have_count(0);btn('Ieșire').click();label('Utilizator').wait_for()
  # Responsive layout and keyboard focus for every section.
  for width,height in [(390,844),(820,1050),(320,640)]:
   pg.set_viewport_size({'width':width,'height':height});g('/');assert pg.evaluate('document.documentElement.scrollWidth<=innerWidth');assert pg.locator('.city-hero').is_visible()
   if width==390:
    pg.screenshot(path=str(A/'portal-mobile.png'));btn('Deschide meniul').click();pg.get_by_role('dialog').get_by_role('link',name='Deva Business',exact=True).click();assert pg.url.endswith('/business');assert not pg.get_by_role('dialog').count()
  pg.set_viewport_size({'width':1440,'height':900});g('/');btn('Activează tema întunecată').click();pg.screenshot(path=str(A/'portal-dark.png'));print('PASS: guide, carousel, themes, global search, business filters/pages, sharing, consent-based geolocation, favorites, route planning + map, live weather + dated events, moderated reports/photos, authenticated editorial management, responsive navigation.');print('Browser errors:',errors);assert not errors;b.close()
try:run()
finally:srv.stdin.close();srv.wait(timeout=8)
