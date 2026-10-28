import Image from 'next/image'
import './Footer.css'
const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand-col">
          <div className="footer-logo">
             <Image
               src="/logo_ft.svg"
               width={265}
               height={62}
               alt="logo"
               />
          </div>
          
          <div className="social-links">
            <Image
               src="/max_logo.svg"
               width={46}
               height={46}
               alt="max"
               />
            <Image
               src="/vk_logo.svg"
               width={46}
               height={46}
               alt="vk"
               />
            <Image
               src="/tg_logo.svg"
               width={46}
               height={46}
               alt="tg"
               />
          </div>

          <div className="accessibility-link">
            <span className="eye-icon">
              <Image
               src="/glasik.svg"
               width={24}
               height={24}
               alt="glazik"
               /></span> Версия для слабовидящих
          </div>

          <div className="copyright-info">
            <p>© Медико-косметологический центр Арт-медика 2026</p>
            <p>Категория 18+</p>
          </div>
        </div>
      <div className='footer-center'>
        <div className="footer-links-col">
          <h3>Клиника</h3>
          <ul>
            <li><a href="#about">О клинике</a></li>
            <li><a href="#specialists">Специалисты</a></li>
            <li><a href="#services">Услуги</a></li>
            <li><a href="#projects">Проекты</a></li>
            <li><a href="#promotions">Акции</a></li>
            <li><a href="#news">Новости</a></li>
            <li><a href="#prices">Цены</a></li>
            <li><a href="#contacts">Контакты</a></li>
            <li><a href="#documents">Документы</a></li>
            <li><a href="#faq">Вопросы и ответы</a></li>
          </ul>
        </div>

        <div className="footer-links-col">
          <h3>Услуги</h3>
          <ul>
            <li><a href="#plastic">Пластическая хирургия</a></li>
            <li><a href="#cosmetology">Косметология</a></li>
            <li><a href="#top-products">Топ-продукты</a></li>
            <li><a href="#dermatology">Дерматология</a></li>
            <li><a href="#otolaryngology">Оториноларингология</a></li>
            <li><a href="#ent-surgery">Лор-хирургия</a></li>
            <li><a href="#neurology">Неврология и рефлексотерапия</a></li>
            <li><a href="#gynecology">Эстетическая гинекологигия</a></li>
            <li><a href="#therapeutic">Терапевтический приём</a></li>
            <li><a href="#massage">Массаж</a></li>
          </ul>
        </div>
      </div>
        <div className="footer-contacts-col">
          <button className="btn-footer">Записаться</button>
          
          <div className="contact-item">
            <span className="contact-icon">
              <Image
               src="/Pin_fill.svg"
               width={24}
               height={24}
               alt="pin"
               /></span>
            <span className="contact-text">Челябинск, пр. Ленина 12а</span>
          </div>
          
          <div className="contact-item">
            <span className="contact-icon">
              <Image
               src="/Phone_fill.svg"
               width={24}
               height={24}
               alt="tel"
               /></span>
            <span className="contact-text">+7 (351) 775-19-18</span>
          </div>
          
          <div className="contact-item">
            <span className="contact-icon">
              <Image
               src="/Message_fill.svg"
               width={24}
               height={24}
               alt="mes"
               /></span>
            <span className="contact-text">marketing.art-medica@mail.ru</span>
          </div>
          
          <div className="contact-item">
            <span className="contact-icon">
              <Image
               src="/Time_fill.svg"
               width={24}
               height={24}
               alt="time"
               /></span>
            <div className="contact-text">
              <strong>09:00 до 20:00</strong>
              <span className="sub-text">понедельник - суббота</span>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-disclaimer">
        ИМЕЮТСЯ ПРОТИВОПОКАЗАНИЯ. НЕОБХОДИМА КОНСУЛЬТАЦИЯ СПЕЦИАЛИСТА
      </div>
    </footer>
  )
}

export default Footer