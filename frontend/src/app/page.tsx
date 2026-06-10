import "./landing.css";
import "./free/mock.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import ShowcaseArchive from "@/components/landing/ShowcaseArchive";
import ShowcaseAdmin from "@/components/landing/ShowcaseAdmin";
import ShowcaseMobile from "@/components/landing/ShowcaseMobile";
import DataViz from "@/components/landing/DataViz";
import Pipeline from "@/components/landing/Pipeline";
import Principles from "@/components/landing/Principles";
import Cta from "@/components/landing/Cta";

export default function Home() {
  return (
    <>
      <Header />
      <main id="top">
        <Hero />
        <Problem />
        <ShowcaseArchive />
        <ShowcaseAdmin />
        <ShowcaseMobile />
        <DataViz />
        <Pipeline />
        <Principles />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
