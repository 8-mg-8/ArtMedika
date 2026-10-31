"use client";

import { useRef, useEffect } from "react";
import Script from "next/script";

export default function YandexMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const isLoadedRef = useRef(false);

  const initMap = async () => {
    if (!mapRef.current) return;

    try {
      // @ts-ignore
      await ymaps3.ready;

      // @ts-ignore
      const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = ymaps3;

      // @ts-ignore
      const ymaps3Markers = await ymaps3.import("@yandex/ymaps3-markers@0.0.1");
      const { YMapDefaultMarker } = ymaps3Markers;

      const targetCoordinates: [number, number] = [61.455243, 55.159495];

      // Гарантированно очищаем контейнер перед рендером
      mapRef.current.innerHTML = "";

      const map = new YMap(mapRef.current, {
        location: {
          center: targetCoordinates,
          zoom: 16,
        },
      });

      map.addChild(new YMapDefaultSchemeLayer({}));
      map.addChild(new YMapDefaultFeaturesLayer({}));

      const marker = new YMapDefaultMarker({
        coordinates: targetCoordinates,
        color: "#0066ff",
        title: "Арт-Медика",
        subtitle: "пр. Ленина, 12А",
      });

      map.addChild(marker);
    } catch (e) {
      console.error("Ошибка при сборке карты:", e);
    }
  };

  // Вызываем инициализацию только после того, как DOM полностью готов
  useEffect(() => {
    // @ts-ignore
    if (typeof ymaps3 !== "undefined" && !isLoadedRef.current) {
      isLoadedRef.current = true;
      initMap();
    }
  }, []);

  return (
    <>
      {/* Скрипт загружается один раз, а запуск карты контролирует useEffect */}
      <Script
        src="https://api-maps.yandex.ru/v3/?apikey=0931b41a-a308-4ad7-870a-8f063d3952a6&lang=ru_RU"
        onLoad={() => {
          if (!isLoadedRef.current) {
            isLoadedRef.current = true;
            initMap();
          }
        }}
      />
      <div ref={mapRef} className="w-full h-full" />
    </>
  );
}
