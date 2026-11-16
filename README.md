

EVREN AI prompt:

godot oyun geliştirme platformunu kullanarak bir mobil uygulama geliştireceğim.
Oyunun teması COP31 de işlenecek olan sustainable development goals 13 climate change hakkında bir oyun olacak.
Benim oluşturmak istediğim oyun şöyle:
İzometrik görsel 2 buçuk D oyuncunun 30 veya 45 derecelik açıyla çapraz yukardan baktığı
(örnek olarak farming simulator oyunları, clash of clans, hayday vb.)
düz zemine kurulu topografik özellikleri olmayan ama göl ağaç gibi doğal unsurları içeren
bir dünya dizaynı oluşturup karakterleri sadece kaz hayvanını içeren
oyuncu arayüzde kazları özelleştirebilecek şekilde bir task simülator oyunu geliştirmek.
Task simulator şu demek oyuncuya sıfır atık,iklim değişikliği odağında eğitim,gıda güvenliği,okyanus ve deniz sağlığı,
iklime dirençli şehirler,karbon ayakizi ve bilinçli tüketim,yenilenebilir enerji ve sürdürülebilirlik konularını içerecek
şekilde oyun içi görevler vermek ve bir şehir oluşturup 
onu büyüterek ona verilen görevleri yerine getirdikçe başarım kazandırmak.
bu görevler ve şehir dinamiği gerçek hayat simülasyon oyunlarında olduğu gibi basit günlük görevlere odaklanacak
Örneğin: oyuncu oyuna başladı kaz olarak yumurtadan çıktı ve kazın rengini beyaz yaptı kaz dünya düzleminde duruyor
oyuncuya tutorial bilgileri veriyor ve ilk göreve yönlendiriyor
kazı yüzdür kaz dünya düzlemindeki haritada denize gidiyor 
bu sırada yükleme ekranında uçan kaz var daha sonra yeni sahne geldiğinde denize giriyor
bir süre yüzdükten sonra denizde plastik atıklar görüyor 
oyuncuya toplaması görevi veriliyor çöpler toplanıyor ve puan olarak kayboluyorlar
Başka bir görevde bir diğer konuya atıf yap oyunda yeteri verimlilikte iş yapamazsa karbon ayak izi artsın
Oyunda görev tamamladıkça şehir oluşmaya başlasın evler araçlar olsun 
yenilenebilir enerji için rüzgar türbinleri ve güneş enerji panellerinin yanı sıra fosil yakıt seçenekleri de olsun
oyuncudan şehrini yönetirken seçim yapması beklensin eğer görevlerine uymayan seçimler zamanla şehirde olumsuzluklara   
örneğin küresel ısınmaya veya karbon ayak izinde hızlı artışa sebep oluyorsa oyunu kaybetsin
Bu verdiğim örnekleri kullanarak oyun içi eşyalarını minimumda tutarak
her konuya eşit görev sayısı vererek bir oyun oluşturacağım
Bunu godotta çalıştırmak için gerekli tüm kaynakları oluştur.
------------------------------------------------------------------------
game structure by evren llm

ClimateKaz/
├── scenes/
│ ├── Player.tscn
│ ├── World.tscn
│ ├── TaskManager.tscn
│ └── UI/
│ ├── TaskUI.tscn
│ └── ScoreUI.tscn
├── scripts/
│ ├── Player.gd
│ ├── TaskManager.gd
│ ├── CityManager.gd
│ └── GameManager.gd
├── textures/
│ ├── player/
│ │ └── duck_idle.png
│ ├── objects/
│ │ ├── plastic.png
│ │ └── wind_turbine.png
│ └── ui/
│ └── task_icon.png
├── audio/
│ ├── water_splash.wav
│ └── plastic_crunch.wav
├── export_presets.cfg
└── project.godot 

Gemini 3.8 flash & Argon max prompt:
This is a structure of a godot project which has no code text for the scripts.
I want you to write scripts and populate the GameManeger.gd  script 
to initialize the game loop and asset manegement.
Also make gap for textures and music can be load by me. 
Its topic is climate change and sustainable development goals.
The game basically includes easy task completion mechanics.
Game similar to simulator game structures and, focuses on resource management 
and environmental desicion-making challenges.
It is 2.5 Dimentional or ortographic view with interactive elements.
This game looks like farming games for example Hayday or Spongebob Adventures: in a jam style
with vibrant,cozy graphics and a relaxing,inuitive user experience.
The main tasks focus only on this topics:
Zero waste,educational focused on climate change, food security, ocean and marine heath
climate-resilient cities, carbon footprint, conscious consumption, renewable energy and sustainability.










