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
    </main>
    <Footer/>
    </>
  );
}
