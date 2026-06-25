export interface City {
  id: string;
  name: {
    az: string;
    en: string;
    ru: string;
  };
}

export const AZERBAIJAN_CITIES: City[] = [
  { id: "baku", name: { az: "Bakı", en: "Baku", ru: "Баку" } },
  { id: "sumqayit", name: { az: "Sumqayıt", en: "Sumgayit", ru: "Сумгаит" } },
  { id: "ganja", name: { az: "Gəncə", en: "Ganja", ru: "Гянджа" } },
  { id: "lankaran", name: { az: "Lənkəran", en: "Lankaran", ru: "Ленкорань" } },
  { id: "shusha", name: { az: "Şuşa", en: "Shusha", ru: "Шуша" } },
  { id: "naxcivan", name: { az: "Naxçıvan", en: "Nakhchivan", ru: "Нахичевань" } },
  { id: "quba", name: { az: "Quba", en: "Quba", ru: "Куба" } },
  { id: "qabala", name: { az: "Qəbələ", en: "Gabala", ru: "Габала" } },
  { id: "sheki", name: { az: "Şəki", en: "Shaki", ru: "Шеки" } },
  { id: "mingecevir", name: { az: "Mingəçevir", en: "Mingachevir", ru: "Мингечаур" } },
  { id: "shirvan", name: { az: "Şirvan", en: "Shirvan", ru: "Ширван" } },
  { id: "khachmaz", name: { az: "Xaçmaz", en: "Khachmaz", ru: "Хачмаз" } },
  { id: "shamkir", name: { az: "Şəmkir", en: "Shamkir", ru: "Шамкир" } },
  { id: "tovuz", name: { az: "Tovuz", en: "Tovuz", ru: "Товуз" } },
  { id: "goychay", name: { az: "Göyçay", en: "Goychay", ru: "Гёйчай" } },
  { id: "berde", name: { az: "Bərdə", en: "Barda", ru: "Барда" } },
  { id: "ismayilli", name: { az: "İsmayıllı", en: "Ismayilli", ru: "Исмаиллы" } },
  { id: "lerik", name: { az: "Lerik", en: "Lerik", ru: "Лерик" } },
  { id: "masalli", name: { az: "Masallı", en: "Masalli", ru: "Масаллы" } },
  { id: "qusar", name: { az: "Qusar", en: "Qusar", ru: "Гусары" } },
  { id: "shamakhi", name: { az: "Şamaxı", en: "Shamakhi", ru: "Шемаха" } },
  { id: "astara", name: { az: "Astara", en: "Astara", ru: "Астара" } }
];
