import YandexMap from "@/components/YandexMap";
import "./map.css";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
export default function ContactsPage() {
  return (
    <>
      <Header />
      <main className="contacts-main font-inter">
        {/* Хлебные крошки */}
        <nav className="breadcrumbs">
          <span>Арт-Медика</span> &gt;{" "}
          <span className="breadcrumbs-active">Контакты</span>
        </nav>

        {/* Заголовок и подзаголовок */}
        <div className="contacts-header">
          <h1 className="contacts-title font-onest">Контакты ↗</h1>
          <p className="contacts-subtitle">
            Пишите нам, когда вам удобно — даже в выходные или ночью. Ваш запрос
            будет обработан в ближайшее рабочее время.
          </p>
        </div>

        {/* Интерактивная карта Яндекс */}
        <div className="map-wrapper">
          <YandexMap />
        </div>

        {/* Сетка с контактными данными */}
        <div className="grid-three-cols">
          {/* Блок: Адрес */}
          <div className="contact-card">
            <h3 className="card-title font-onest">Адрес</h3>
            <p className="card-text">
              454007, Челябинская область,
              <br />
              г. Челябинск, проспект Ленина 12 "А"
              <br />
              <span className="card-hint">(рядом Театр ЧТЗ)</span>
            </p>
          </div>

          {/* Блок: Телефоны */}
          <div className="contact-card">
            <h3 className="card-title font-onest">Телефоны</h3>
            <ul className="card-list">
              <li className="card-list-item">
                <a href="tel:+73517751918" className="card-link">
                  +7 (351) 775-19-18
                </a>
                <span className="card-hint"> — запись на прием</span>
              </li>
              <li className="card-list-item">
                <a href="tel:+73517751988" className="card-link">
                  +7 (351) 775-19-88
                </a>
                <span className="card-hint"> — горячая линия</span>
              </li>
            </ul>
          </div>

          {/* Блок: E-mail */}
          <div className="contact-card">
            <h3 className="card-title font-onest">E-mail</h3>
            <ul className="card-list break-word">
              <li className="card-list-item">
                <a href="mailto:sender@artmdc.ru" className="card-link">
                  sender@artmdc.ru
                </a>
                <span className="card-hint"> — отправка анализов</span>
              </li>
              <li className="card-list-item">
                <a
                  href="mailto:marketing.art-medica@mail.ru"
                  className="card-link"
                >
                  marketing.art-medica@mail.ru
                </a>
                <span className="card-hint"> — прием обращений</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Вторая строка карточек */}
        <div className="grid-two-cols">
          {/* Блок: Сообщения */}
          <div className="contact-card">
            <h3 className="card-title font-onest">Сообщения</h3>
            <p className="card-text">
              <a href="https://t.me" target="_blank" className="card-link">
                +7 (912) 326-34-60
              </a>{" "}
              — Telegram, MAX
            </p>
          </div>

          {/* Блок: Режим работы */}
          <div className="contact-card">
            <h3 className="card-title font-onest">Режим работы</h3>
            <p className="card-text font-semibold">
              ПН–СБ <span className="font-normal">с 9:00 до 20:00</span>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
