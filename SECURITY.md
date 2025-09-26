# Güvenlik Politikası

## Giriş

NotAnaliz projesinin güvenliği bizim için en önemli önceliklerden biridir. Potansiyel güvenlik açıklarını sorumlu bir şekilde bildiren güvenlik araştırmacılarıyla çalışmayı takdir ediyoruz. Güvenlik açıklarının tespit edilmesine ve düzeltilmesine yardımcı olan herkesin çabalarına değer veriyoruz.

## Güvenlik Açığı Bildirimi

Eğer NotAnaliz uygulamasında bir güvenlik açığı bulduğunuzu düşünüyorsanız, lütfen **herkese açık bir GitHub issue oluşturmayın**. Bunun yerine, bulgularınızı bize özel olarak bildirmenizi rica ederiz.

Lütfen raporunuzu aşağıdaki adrese e-posta ile gönderin:
**`security@example.com`** (Not: Bu, gerçek bir e-posta adresi değildir. Bu bir şablondur.)

Lütfen raporunuza mümkün olduğunca fazla bilgi ekleyin:
*   Açığın ayrıntılı bir açıklaması.
*   Açığı yeniden oluşturmak için gereken adımlar (varsa ekran görüntüleri, videolar, kod parçacıkları veya kavram kanıtı (PoC)).
*   Açığın potansiyel etkisi.
*   Varsa, önerdiğiniz çözüm yolları.
*   İletişim bilgileriniz.

Raporunuzu aldıktan sonra 48 saat içinde size bir onay göndermeyi ve açığı düzeltme süreci boyunca sizi düzenli olarak bilgilendirmeyi hedefliyoruz.

## Güvenlik Uygulamalarımız

*   **Kimlik Doğrulama ve Veritabanı:** Kullanıcı kimlik doğrulaması, yetkilendirme ve veritabanı yönetimi için Supabase kullanıyoruz. Veri erişimi, Supabase'in Satır Düzeyinde Güvenlik (RLS) politikaları ile sıkı bir şekilde kontrol edilmektedir. Bu, kullanıcıların yalnızca kendi verilerine erişebilmesini sağlar.
*   **API Anahtarları:** Google Gemini API anahtarı gibi hassas bilgiler, sunucu tarafında ortam değişkenleri (`process.env`) aracılığıyla güvenli bir şekilde yönetilir ve istemci tarafı koduna asla dahil edilmez.
*   **Bağımlılıklar:** Proje bağımlılıklarını düzenli olarak gözden geçirir ve bilinen güvenlik açıklarına karşı güncel tutmaya özen gösteririz.
*   **İletişim:** Tüm trafik HTTPS üzerinden şifrelenmektedir.

## Kapsam Dışı Güvenlik Açıkları

Aşağıdaki konular genellikle güvenlik açığı olarak kabul edilmez ve bildirilmemelidir:
*   Sosyal mühendislik veya oltalama (phishing) saldırıları.
*   Güncel tarayıcılarda engellenen "Self-XSS" (kullanıcının kendi tarayıcısında kod çalıştırmasını gerektiren açıklar).
*   CSRF koruması olmayan "çıkış yap" gibi hassas olmayan eylemler.
*   Hizmet reddi (DoS/DDoS) saldırıları.
*   Eksik HTTP güvenlik başlıkları (exploit kanıtı olmadan).
*   Yazılım sürümünün ifşa olması.

Bu belge, güvenlik topluluğu ile olan ilişkimizi ve güvenlik açıklarını ele alma sürecimizi şeffaf bir şekilde ortaya koymayı amaçlamaktadır. Katkılarınız için şimdiden teşekkür ederiz.
