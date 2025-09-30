import React from "react";
import CountryMoviesSection from "./CountryMoviesSection";
import "../css/CountriesBlock.css";

export default function CountriesBlock() {
  return (
    <section className="countries-block container-xl compact">
     

      {/* Lưu ý: truyền noBg để CountryMoviesSection không tự có nền riêng */}
      <CountryMoviesSection
        title="Phim Hàn Quốc"
        country="South Korea"
        link={`/danh-muc/quoc-gia/${encodeURIComponent("South Korea")}`}
        noBg
      />

      <CountryMoviesSection
        title="Phim Việt Nam"
        country="Vietnam"
        link={`/danh-muc/quoc-gia/${encodeURIComponent("Vietnam")}`}
        noBg
      />

      <CountryMoviesSection
        title="Phim US-UK"
        countries={["United States", "United Kingdom"]}
        link={`/danh-muc/quoc-gia/us-uk`}
        noBg
      />
    </section>
  );
}
