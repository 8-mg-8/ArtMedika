import Image from "next/image"
import './Header.css'
const Header = () => {
  return (
    <header className="site-header">
      <Image
        src="/logo_ft.svg"
        width={270}
        height={64}
        alt="logo"
        />
      <nav className="nav-menu">
        <a href="#about">О клинике</a>
        <a href="#services">Услуги</a>
        <a href="#specialists">Специалисты</a>
        <a href="#promotions">Акции</a>
        <a href="#documents">Документы</a>
        <a href="#contacts">Контакты</a>
      </nav>
      <div className="header-right">
        <div className="contacts-info">
          <span className="address">Челябинск, пр. Ленина 12а</span>
          <span className="work-hours">ПН-СБ с 9:00 до 20:00</span>
        </div>
        <button className="head-btn ">Записаться</button>
      </div>
    </header>
  )
}

export default Header