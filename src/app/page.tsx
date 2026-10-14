import Image from "next/image";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import './main.css';

export default function Home() {
  return (
    <>
    <Header/>
    <main className="">
    <div className="block-1">
      <div className="block-overlay"></div>
      <div className="block-1-text">
        <h1>Ваше здоровье — наша забота</h1>
        <h2>Медико-косметологический центр с современным оборудованием и опытными специалистами</h2>
      </div>
      <div className="block-1-kubiki">
          <div className="block-1-kubik">
            <div className="kubik-text">
              <h4>20</h4>
              <p style={{width:'254px'}}>лет опыта работы в сфере медицины</p>
            </div>
          </div>
          <div className="block-1-kubik">
            <div className="kubik-text">
              <h4>20</h4>
              <p>видов медицинских направлений деятельности</p>
            </div>
          </div>
          <div className="block-1-kubik">
            <div className="kubik-text">
              <h4>40+</h4>
              <p style={{width:'270px'}}>квалифицированных специалистов</p>
            </div>
          </div>
      </div>
    </div>
    
    <div className="block-2">

    </div>

    <div className="block-3">
      <div className="block-3-title">
        <h3 className="block-title" style={{textAlign:'center'}}>
          Превращаем заветные мечты пациентов
        </h3>
        <h3 className="block-title">
          в реальность, невзирая на сложность задачи
        </h3>
      </div>
      <div className="block-3-content">
        <div className="block-3-left">
          <Image
          src="/block3.svg"
          width={705}
          height={607}
          alt="logo"
          />
        </div>
        <div className="block-3-right">
          <div className="block-3-right-text">
            <p className="block-3-right-text-brown">
              Центр «Арт-Медика» — партнер ЮУГМУ, клиническая база «Межрегионального центра непрерывного медицинского и фармацевтического образования» 
              (г. Москва). Наша клиника является участником международных проектов в направлении "Пластическая хирургия и косметология".
            </p>
            <p className="block-3-right-text-black">Качество результата обеспечивает инновационное высокотехнологичное хирургическое, эндоскопическое и лазерное оборудование.</p>
          </div>
          <div className="block-3-right-kubiki">
            <div className="block-3-right-kubik">
              <h4>10+</h4>
              <p>обучений в год проходят специальсты центра</p>
            </div>
            <div className="block-3-right-kubik">
              <h4>20</h4>
              <p>проектов уже было реализовано в нашей клинике</p>
            </div>
            <div className="block-3-right-kubik">
              <h4>90%</h4>
              <p>положительных отзывов</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </main>
    <Footer/>
    </>
  );
}
