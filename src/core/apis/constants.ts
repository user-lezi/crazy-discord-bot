export interface LanguageEntry {
  name: string;
  code: string;
  country: {
    code: string;
    name: string;
    emoji: string;
  };
}

/** For VGJR api translate */
export const Languages: LanguageEntry[] = [
  {
    name: "Abkhaz",
    code: "ab",
    country: { code: "GE", name: "Georgia", emoji: "🇬🇪" },
  },
  {
    name: "Acehnese",
    code: "ace",
    country: { code: "ID", name: "Indonesia", emoji: "🇮🇩" },
  },
  {
    name: "Acholi",
    code: "ach",
    country: { code: "UG", name: "Uganda", emoji: "🇺🇬" },
  },
  {
    name: "Afar",
    code: "aa",
    country: { code: "ET", name: "Ethiopia", emoji: "🇪🇹" },
  },
  {
    name: "Afrikaans",
    code: "af",
    country: { code: "ZA", name: "South Africa", emoji: "🇿🇦" },
  },
  {
    name: "Albanian",
    code: "sq",
    country: { code: "AL", name: "Albania", emoji: "🇦🇱" },
  },
  {
    name: "Alur",
    code: "alz",
    country: { code: "UG", name: "Uganda", emoji: "🇺🇬" },
  },
  {
    name: "Amharic",
    code: "am",
    country: { code: "ET", name: "Ethiopia", emoji: "🇪🇹" },
  },
  {
    name: "Arabic",
    code: "ar",
    country: { code: "SA", name: "Saudi Arabia", emoji: "🇸🇦" },
  },
  {
    name: "Armenian",
    code: "hy",
    country: { code: "AM", name: "Armenia", emoji: "🇦🇲" },
  },
  {
    name: "Assamese",
    code: "as",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Avar",
    code: "av",
    country: { code: "RU", name: "Russia", emoji: "🇷🇺" },
  },
  {
    name: "Awadhi",
    code: "awa",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Aymara",
    code: "ay",
    country: { code: "BO", name: "Bolivia", emoji: "🇧🇴" },
  },
  {
    name: "Azerbaijani",
    code: "az",
    country: { code: "AZ", name: "Azerbaijan", emoji: "🇦🇿" },
  },
  {
    name: "Balinese",
    code: "ban",
    country: { code: "ID", name: "Indonesia", emoji: "🇮🇩" },
  },
  {
    name: "Bambara",
    code: "bm",
    country: { code: "ML", name: "Mali", emoji: "🇲🇱" },
  },
  {
    name: "Bashkir",
    code: "ba",
    country: { code: "RU", name: "Russia", emoji: "🇷🇺" },
  },
  {
    name: "Basque",
    code: "eu",
    country: { code: "ES", name: "Spain", emoji: "🇪🇸" },
  },
  {
    name: "Batak Karo",
    code: "btx",
    country: { code: "ID", name: "Indonesia", emoji: "🇮🇩" },
  },
  {
    name: "Batak Simalungun",
    code: "bts",
    country: { code: "ID", name: "Indonesia", emoji: "🇮🇩" },
  },
  {
    name: "Batak Toba",
    code: "bbc",
    country: { code: "ID", name: "Indonesia", emoji: "🇮🇩" },
  },
  {
    name: "Belarusian",
    code: "be",
    country: { code: "BY", name: "Belarus", emoji: "🇧🇾" },
  },
  {
    name: "Bengali",
    code: "bn",
    country: { code: "BD", name: "Bangladesh", emoji: "🇧🇩" },
  },
  {
    name: "Bhojpuri",
    code: "bho",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Bikol",
    code: "bik",
    country: { code: "PH", name: "Philippines", emoji: "🇵🇭" },
  },
  {
    name: "Bosnian",
    code: "bs",
    country: { code: "BA", name: "Bosnia and Herzegovina", emoji: "🇧🇦" },
  },
  {
    name: "Breton",
    code: "br",
    country: { code: "FR", name: "France", emoji: "🇫🇷" },
  },
  {
    name: "Bulgarian",
    code: "bg",
    country: { code: "BG", name: "Bulgaria", emoji: "🇧🇬" },
  },
  {
    name: "Buryat",
    code: "bua",
    country: { code: "RU", name: "Russia", emoji: "🇷🇺" },
  },
  {
    name: "Cantonese",
    code: "yue",
    country: { code: "HK", name: "Hong Kong", emoji: "🇭🇰" },
  },
  {
    name: "Catalan",
    code: "ca",
    country: { code: "ES", name: "Spain", emoji: "🇪🇸" },
  },
  {
    name: "Cebuano",
    code: "ceb",
    country: { code: "PH", name: "Philippines", emoji: "🇵🇭" },
  },
  {
    name: "Chamorro",
    code: "ch",
    country: { code: "GU", name: "Guam", emoji: "🇬🇺" },
  },
  {
    name: "Chechen",
    code: "ce",
    country: { code: "RU", name: "Russia", emoji: "🇷🇺" },
  },
  {
    name: "Chichewa",
    code: "ny",
    country: { code: "MW", name: "Malawi", emoji: "🇲🇼" },
  },
  {
    name: "Chinese (Simplified)",
    code: "zh-CN",
    country: { code: "CN", name: "China", emoji: "🇨🇳" },
  },
  {
    name: "Chinese (Traditional)",
    code: "zh-TW",
    country: { code: "TW", name: "Taiwan", emoji: "🇹🇼" },
  },
  {
    name: "Chuvash",
    code: "cv",
    country: { code: "RU", name: "Russia", emoji: "🇷🇺" },
  },
  {
    name: "Corsican",
    code: "co",
    country: { code: "FR", name: "France", emoji: "🇫🇷" },
  },
  {
    name: "Crimean Tatar",
    code: "crh",
    country: { code: "UA", name: "Ukraine", emoji: "🇺🇦" },
  },
  {
    name: "Croatian",
    code: "hr",
    country: { code: "HR", name: "Croatia", emoji: "🇭🇷" },
  },
  {
    name: "Czech",
    code: "cs",
    country: { code: "CZ", name: "Czechia", emoji: "🇨🇿" },
  },
  {
    name: "Danish",
    code: "da",
    country: { code: "DK", name: "Denmark", emoji: "🇩🇰" },
  },
  {
    name: "Dhivehi",
    code: "dv",
    country: { code: "MV", name: "Maldives", emoji: "🇲🇻" },
  },
  {
    name: "Dininkka",
    code: "din",
    country: { code: "SS", name: "South Sudan", emoji: "🇸🇸" },
  },
  {
    name: "Dogri",
    code: "doi",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Dombe",
    code: "dom",
    country: { code: "ZM", name: "Zambia", emoji: "🇿🇲" },
  },
  {
    name: "Dutch",
    code: "nl",
    country: { code: "NL", name: "Netherlands", emoji: "🇳🇱" },
  },
  {
    name: "Dyula",
    code: "dyu",
    country: { code: "CI", name: "Côte d'Ivoire", emoji: "🇨🇮" },
  },
  {
    name: "Dzongkha",
    code: "dz",
    country: { code: "BT", name: "Bhutan", emoji: "🇧🇹" },
  },
  {
    name: "English",
    code: "en",
    country: { code: "GB", name: "United Kingdom", emoji: "🇬🇧" },
  },
  {
    name: "Esperanto",
    code: "eo",
    country: { code: "UN", name: "International", emoji: "🌐" },
  },
  {
    name: "Estonian",
    code: "et",
    country: { code: "EE", name: "Estonia", emoji: "🇪🇪" },
  },
  {
    name: "Ewe",
    code: "ee",
    country: { code: "GH", name: "Ghana", emoji: "🇬🇭" },
  },
  {
    name: "Faroese",
    code: "fo",
    country: { code: "FO", name: "Faroe Islands", emoji: "🇫🇴" },
  },
  {
    name: "Fijian",
    code: "fj",
    country: { code: "FJ", name: "Fiji", emoji: "🇫🇯" },
  },
  {
    name: "Filipino",
    code: "fil",
    country: { code: "PH", name: "Philippines", emoji: "🇵🇭" },
  },
  {
    name: "Finnish",
    code: "fi",
    country: { code: "FI", name: "Finland", emoji: "🇫🇮" },
  },
  {
    name: "French",
    code: "fr",
    country: { code: "FR", name: "France", emoji: "🇫🇷" },
  },
  {
    name: "French (Canada)",
    code: "fr-CA",
    country: { code: "CA", name: "Canada", emoji: "🇨🇦" },
  },
  {
    name: "Frisian",
    code: "fy",
    country: { code: "NL", name: "Netherlands", emoji: "🇳🇱" },
  },
  {
    name: "Friulian",
    code: "fur",
    country: { code: "IT", name: "Italy", emoji: "🇮🇹" },
  },
  {
    name: "Fulani",
    code: "ff",
    country: { code: "GN", name: "Guinea", emoji: "🇬🇳" },
  },
  {
    name: "Ga",
    code: "gaa",
    country: { code: "GH", name: "Ghana", emoji: "🇬🇭" },
  },
  {
    name: "Galician",
    code: "gl",
    country: { code: "ES", name: "Spain", emoji: "🇪🇸" },
  },
  {
    name: "Georgian",
    code: "ka",
    country: { code: "GE", name: "Georgia", emoji: "🇬🇪" },
  },
  {
    name: "German",
    code: "de",
    country: { code: "DE", name: "Germany", emoji: "🇩🇪" },
  },
  {
    name: "Greek",
    code: "el",
    country: { code: "GR", name: "Greece", emoji: "🇬🇷" },
  },
  {
    name: "Guarani",
    code: "gn",
    country: { code: "PY", name: "Paraguay", emoji: "🇵🇾" },
  },
  {
    name: "Gujarati",
    code: "gu",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Haitian Creole",
    code: "ht",
    country: { code: "HT", name: "Haiti", emoji: "🇭🇹" },
  },
  {
    name: "Hakha Chin",
    code: "cnh",
    country: { code: "MM", name: "Myanmar", emoji: "🇲🇲" },
  },
  {
    name: "Hausa",
    code: "ha",
    country: { code: "NG", name: "Nigeria", emoji: "🇳🇬" },
  },
  {
    name: "Hawaiian",
    code: "haw",
    country: { code: "US", name: "United States", emoji: "🇺🇸" },
  },
  {
    name: "Hebrew",
    code: "he",
    country: { code: "IL", name: "Israel", emoji: "🇮🇱" },
  },
  {
    name: "Hindi",
    code: "hi",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Hmong",
    code: "hmn",
    country: { code: "LA", name: "Laos", emoji: "🇱🇦" },
  },
  {
    name: "Hungarian",
    code: "hu",
    country: { code: "HU", name: "Hungary", emoji: "🇭🇺" },
  },
  {
    name: "Hunsrik",
    code: "hrx",
    country: { code: "BR", name: "Brazil", emoji: "🇧🇷" },
  },
  {
    name: "Iban",
    code: "iba",
    country: { code: "MY", name: "Malaysia", emoji: "🇲🇾" },
  },
  {
    name: "Icelandic",
    code: "is",
    country: { code: "IS", name: "Iceland", emoji: "🇮🇸" },
  },
  {
    name: "Igbo",
    code: "ig",
    country: { code: "NG", name: "Nigeria", emoji: "🇳🇬" },
  },
  {
    name: "Ilocano",
    code: "ilo",
    country: { code: "PH", name: "Philippines", emoji: "🇵🇭" },
  },
  {
    name: "Indonesian",
    code: "id",
    country: { code: "ID", name: "Indonesia", emoji: "🇮🇩" },
  },
  {
    name: "Irish",
    code: "ga",
    country: { code: "IE", name: "Ireland", emoji: "🇮🇪" },
  },
  {
    name: "Italian",
    code: "it",
    country: { code: "IT", name: "Italy", emoji: "🇮🇹" },
  },
  {
    name: "Japanese",
    code: "ja",
    country: { code: "JP", name: "Japan", emoji: "🇯🇵" },
  },
  {
    name: "Javanese",
    code: "jv",
    country: { code: "ID", name: "Indonesia", emoji: "🇮🇩" },
  },
  {
    name: "Jingpo",
    code: "kac",
    country: { code: "MM", name: "Myanmar", emoji: "🇲🇲" },
  },
  {
    name: "Kalaallisut",
    code: "kl",
    country: { code: "GL", name: "Greenland", emoji: "🇬🇱" },
  },
  {
    name: "Kannada",
    code: "kn",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Kanuri",
    code: "kr",
    country: { code: "NG", name: "Nigeria", emoji: "🇳🇬" },
  },
  {
    name: "Kapampangan",
    code: "pam",
    country: { code: "PH", name: "Philippines", emoji: "🇵🇭" },
  },
  {
    name: "Kazakh",
    code: "kk",
    country: { code: "KZ", name: "Kazakhstan", emoji: "🇰🇿" },
  },
  {
    name: "Khasi",
    code: "kha",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Khmer",
    code: "km",
    country: { code: "KH", name: "Cambodia", emoji: "🇰🇭" },
  },
  {
    name: "Kiga",
    code: "cgg",
    country: { code: "UG", name: "Uganda", emoji: "🇺🇬" },
  },
  {
    name: "Kikongo",
    code: "kg",
    country: { code: "CD", name: "DR Congo", emoji: "🇨🇩" },
  },
  {
    name: "Kinyarwanda",
    code: "rw",
    country: { code: "RW", name: "Rwanda", emoji: "🇷🇼" },
  },
  {
    name: "Kituba",
    code: "ktu",
    country: { code: "CD", name: "DR Congo", emoji: "🇨🇩" },
  },
  {
    name: "Kokborok",
    code: "trp",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Konkani",
    code: "gom",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Korean",
    code: "ko",
    country: { code: "KR", name: "South Korea", emoji: "🇰🇷" },
  },
  {
    name: "Krio",
    code: "kri",
    country: { code: "SL", name: "Sierra Leone", emoji: "🇸🇱" },
  },
  {
    name: "Kurdish (Kurmanji)",
    code: "ku",
    country: { code: "TR", name: "Turkey", emoji: "🇹🇷" },
  },
  {
    name: "Kurdish (Sorani)",
    code: "ckb",
    country: { code: "IQ", name: "Iraq", emoji: "🇮🇶" },
  },
  {
    name: "Kyrgyz",
    code: "ky",
    country: { code: "KG", name: "Kyrgyzstan", emoji: "🇰🇬" },
  },
  {
    name: "Lao",
    code: "lo",
    country: { code: "LA", name: "Laos", emoji: "🇱🇦" },
  },
  {
    name: "Latavian",
    code: "lv",
    country: { code: "LV", name: "Latvia", emoji: "🇱🇻" },
  },
  {
    name: "Ligurian",
    code: "lij",
    country: { code: "IT", name: "Italy", emoji: "🇮🇹" },
  },
  {
    name: "Limburgish",
    code: "li",
    country: { code: "NL", name: "Netherlands", emoji: "🇳🇱" },
  },
  {
    name: "Lingala",
    code: "ln",
    country: { code: "CD", name: "DR Congo", emoji: "🇨🇩" },
  },
  {
    name: "Lithuanian",
    code: "lt",
    country: { code: "LT", name: "Lithuania", emoji: "🇱🇹" },
  },
  {
    name: "Lombard",
    code: "lmo",
    country: { code: "IT", name: "Italy", emoji: "🇮🇹" },
  },
  {
    name: "Luganda",
    code: "lg",
    country: { code: "UG", name: "Uganda", emoji: "🇺🇬" },
  },
  {
    name: "Luo",
    code: "luo",
    country: { code: "KE", name: "Kenya", emoji: "🇰🇪" },
  },
  {
    name: "Luxembourgish",
    code: "lb",
    country: { code: "LU", name: "Luxembourg", emoji: "🇱🇺" },
  },
  {
    name: "Macedonian",
    code: "mk",
    country: { code: "MK", name: "North Macedonia", emoji: "🇲🇰" },
  },
  {
    name: "Madurese",
    code: "mad",
    country: { code: "ID", name: "Indonesia", emoji: "🇮🇩" },
  },
  {
    name: "Magahi",
    code: "mag",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Maithili",
    code: "mai",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Makassar",
    code: "mak",
    country: { code: "ID", name: "Indonesia", emoji: "🇮🇩" },
  },
  {
    name: "Malagasy",
    code: "mg",
    country: { code: "MG", name: "Madagascar", emoji: "🇲🇬" },
  },
  {
    name: "Malay",
    code: "ms",
    country: { code: "MY", name: "Malaysia", emoji: "🇲🇾" },
  },
  {
    name: "Malayalam",
    code: "ml",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Maltese",
    code: "mt",
    country: { code: "MT", name: "Malta", emoji: "🇲🇹" },
  },
  {
    name: "Mam",
    code: "mam",
    country: { code: "GT", name: "Guatemala", emoji: "🇬🇹" },
  },
  {
    name: "Manx",
    code: "gv",
    country: { code: "IM", name: "Isle of Man", emoji: "🇮🇲" },
  },
  {
    name: "Maori",
    code: "mi",
    country: { code: "NZ", name: "New Zealand", emoji: "🇳🇿" },
  },
  {
    name: "Marathi",
    code: "mr",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Marshallese",
    code: "mh",
    country: { code: "MH", name: "Marshall Islands", emoji: "🇲🇭" },
  },
  {
    name: "Marwadi",
    code: "mwr",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Mauritian Creole",
    code: "mfe",
    country: { code: "MU", name: "Mauritius", emoji: "🇲🇺" },
  },
  {
    name: "Meiteilon (Manipuri)",
    code: "mni-Mtei",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Minangkabau",
    code: "min",
    country: { code: "ID", name: "Indonesia", emoji: "🇮🇩" },
  },
  {
    name: "Mizo",
    code: "lus",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Mongolian",
    code: "mn",
    country: { code: "MN", name: "Mongolia", emoji: "🇲🇳" },
  },
  {
    name: "Myanmar (Burmese)",
    code: "my",
    country: { code: "MM", name: "Myanmar", emoji: "🇲🇲" },
  },
  {
    name: "Nahuatl",
    code: "nah",
    country: { code: "MX", name: "Mexico", emoji: "🇲🇽" },
  },
  {
    name: "Ndau",
    code: "ndc",
    country: { code: "ZW", name: "Zimbabwe", emoji: "🇿🇼" },
  },
  {
    name: "Ndebele (South)",
    code: "nr",
    country: { code: "ZA", name: "South Africa", emoji: "🇿🇦" },
  },
  {
    name: "Nepalbhasha (Newari)",
    code: "new",
    country: { code: "NP", name: "Nepal", emoji: "🇳🇵" },
  },
  {
    name: "Nepali",
    code: "ne",
    country: { code: "NP", name: "Nepal", emoji: "🇳🇵" },
  },
  {
    name: "NKo",
    code: "nko",
    country: { code: "GN", name: "Guinea", emoji: "🇬🇳" },
  },
  {
    name: "Norwegian",
    code: "no",
    country: { code: "NO", name: "Norway", emoji: "🇳🇴" },
  },
  {
    name: "Nuer",
    code: "nus",
    country: { code: "SS", name: "South Sudan", emoji: "🇸🇸" },
  },
  {
    name: "Occitan",
    code: "oc",
    country: { code: "FR", name: "France", emoji: "🇫🇷" },
  },
  {
    name: "Odia (Oriya)",
    code: "or",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Oromo",
    code: "om",
    country: { code: "ET", name: "Ethiopia", emoji: "🇪🇹" },
  },
  {
    name: "Ossetian",
    code: "os",
    country: { code: "RU", name: "Russia", emoji: "🇷🇺" },
  },
  {
    name: "Pangasinan",
    code: "pag",
    country: { code: "PH", name: "Philippines", emoji: "🇵🇭" },
  },
  {
    name: "Papiamento",
    code: "pap",
    country: { code: "AW", name: "Aruba", emoji: "🇦🇼" },
  },
  {
    name: "Pashto",
    code: "ps",
    country: { code: "AF", name: "Afghanistan", emoji: "🇦🇫" },
  },
  {
    name: "Persian",
    code: "fa",
    country: { code: "IR", name: "Iran", emoji: "🇮🇷" },
  },
  {
    name: "Polish",
    code: "pl",
    country: { code: "PL", name: "Poland", emoji: "🇵🇱" },
  },
  {
    name: "Portuguese (Brazil)",
    code: "pt-BR",
    country: { code: "BR", name: "Brazil", emoji: "🇧🇷" },
  },
  {
    name: "Portuguese (Portugal)",
    code: "pt-PT",
    country: { code: "PT", name: "Portugal", emoji: "🇵🇹" },
  },
  {
    name: "Punjabi (Gurmukhi)",
    code: "pa",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Punjabi (Shahmukhi)",
    code: "pa-Arab",
    country: { code: "PK", name: "Pakistan", emoji: "🇵🇰" },
  },
  {
    name: "Quechua",
    code: "qu",
    country: { code: "PE", name: "Peru", emoji: "🇵🇪" },
  },
  {
    name: "Qʼeqchiʼ",
    code: "kek",
    country: { code: "GT", name: "Guatemala", emoji: "🇬🇹" },
  },
  {
    name: "Romani",
    code: "rom",
    country: { code: "RO", name: "Romania", emoji: "🇷🇴" },
  },
  {
    name: "Romanian",
    code: "ro",
    country: { code: "RO", name: "Romania", emoji: "🇷🇴" },
  },
  {
    name: "Rundi",
    code: "rn",
    country: { code: "BI", name: "Burundi", emoji: "🇧🇮" },
  },
  {
    name: "Russian",
    code: "ru",
    country: { code: "RU", name: "Russia", emoji: "🇷🇺" },
  },
  {
    name: "Samoan",
    code: "sm",
    country: { code: "WS", name: "Samoa", emoji: "🇼🇸" },
  },
  {
    name: "Sango",
    code: "sg",
    country: { code: "CF", name: "Central African Republic", emoji: "🇨🇫" },
  },
  {
    name: "Sanskrit",
    code: "sa",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Santali",
    code: "sat",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Scots Gaelic",
    code: "gd",
    country: { code: "GB", name: "United Kingdom", emoji: "🇬🇧" },
  },
  {
    name: "Sepedi",
    code: "nso",
    country: { code: "ZA", name: "South Africa", emoji: "🇿🇦" },
  },
  {
    name: "Serbian",
    code: "sr",
    country: { code: "RS", name: "Serbia", emoji: "🇷🇸" },
  },
  {
    name: "Sesotho",
    code: "st",
    country: { code: "LS", name: "Lesotho", emoji: "🇱🇸" },
  },
  {
    name: "Seychellois Creole",
    code: "crs",
    country: { code: "SC", name: "Seychelles", emoji: "🇸🇨" },
  },
  {
    name: "Shan",
    code: "shn",
    country: { code: "MM", name: "Myanmar", emoji: "🇲🇲" },
  },
  {
    name: "Shona",
    code: "sn",
    country: { code: "ZW", name: "Zimbabwe", emoji: "🇿🇼" },
  },
  {
    name: "Sicilian",
    code: "scn",
    country: { code: "IT", name: "Italy", emoji: "🇮🇹" },
  },
  {
    name: "Silesian",
    code: "szl",
    country: { code: "PL", name: "Poland", emoji: "🇵🇱" },
  },
  {
    name: "Sindhi",
    code: "sd",
    country: { code: "PK", name: "Pakistan", emoji: "🇵🇰" },
  },
  {
    name: "Sinhala",
    code: "si",
    country: { code: "LK", name: "Sri Lanka", emoji: "🇱🇰" },
  },
  {
    name: "Slovak",
    code: "sk",
    country: { code: "SK", name: "Slovakia", emoji: "🇸🇰" },
  },
  {
    name: "Slovenian",
    code: "sl",
    country: { code: "SI", name: "Slovenia", emoji: "🇸🇮" },
  },
  {
    name: "Somali",
    code: "so",
    country: { code: "SO", name: "Somalia", emoji: "🇸🇴" },
  },
  {
    name: "Spanish",
    code: "es",
    country: { code: "ES", name: "Spain", emoji: "🇪🇸" },
  },
  {
    name: "Sundanese",
    code: "su",
    country: { code: "ID", name: "Indonesia", emoji: "🇮🇩" },
  },
  {
    name: "Susu",
    code: "sus",
    country: { code: "GN", name: "Guinea", emoji: "🇬🇳" },
  },
  {
    name: "Swahili",
    code: "sw",
    country: { code: "TZ", name: "Tanzania", emoji: "🇹🇿" },
  },
  {
    name: "Swati",
    code: "ss",
    country: { code: "SZ", name: "Eswatini", emoji: "🇸🇿" },
  },
  {
    name: "Swedish",
    code: "sv",
    country: { code: "SE", name: "Sweden", emoji: "🇸🇪" },
  },
  {
    name: "Tahitian",
    code: "ty",
    country: { code: "PF", name: "French Polynesia", emoji: "🇵🇫" },
  },
  {
    name: "Tajik",
    code: "tg",
    country: { code: "TJ", name: "Tajikistan", emoji: "🇹🇯" },
  },
  {
    name: "Tamazight",
    code: "tzm",
    country: { code: "MA", name: "Morocco", emoji: "🇲🇦" },
  },
  {
    name: "Tamazight (Tifinagh)",
    code: "ber-Tfng",
    country: { code: "MA", name: "Morocco", emoji: "🇲🇦" },
  },
  {
    name: "Tamil",
    code: "ta",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Tatar",
    code: "tt",
    country: { code: "RU", name: "Russia", emoji: "🇷🇺" },
  },
  {
    name: "Telugu",
    code: "te",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Tetum",
    code: "tet",
    country: { code: "TL", name: "Timor-Leste", emoji: "🇹🇱" },
  },
  {
    name: "Thai",
    code: "th",
    country: { code: "TH", name: "Thailand", emoji: "🇹🇭" },
  },
  {
    name: "Tibetan",
    code: "bo",
    country: { code: "CN", name: "China", emoji: "🇨🇳" },
  },
  {
    name: "Tigrinya",
    code: "ti",
    country: { code: "ER", name: "Eritrea", emoji: "🇪🇷" },
  },
  {
    name: "Tiv",
    code: "tiv",
    country: { code: "NG", name: "Nigeria", emoji: "🇳🇬" },
  },
  {
    name: "Tok Pisin",
    code: "tpi",
    country: { code: "PG", name: "Papua New Guinea", emoji: "🇵🇬" },
  },
  {
    name: "Tongan",
    code: "to",
    country: { code: "TO", name: "Tonga", emoji: "🇹🇴" },
  },
  {
    name: "Tsonga",
    code: "ts",
    country: { code: "ZA", name: "South Africa", emoji: "🇿🇦" },
  },
  {
    name: "Tswana",
    code: "tn",
    country: { code: "BW", name: "Botswana", emoji: "🇧🇼" },
  },
  {
    name: "Tulu",
    code: "tcy",
    country: { code: "IN", name: "India", emoji: "🇮🇳" },
  },
  {
    name: "Tumbuka",
    code: "tum",
    country: { code: "MW", name: "Malawi", emoji: "🇲🇼" },
  },
  {
    name: "Turkish",
    code: "tr",
    country: { code: "TR", name: "Turkey", emoji: "🇹🇷" },
  },
  {
    name: "Turkmen",
    code: "tk",
    country: { code: "TM", name: "Turkmenistan", emoji: "🇹🇲" },
  },
  {
    name: "Tuvan",
    code: "tyv",
    country: { code: "RU", name: "Russia", emoji: "🇷🇺" },
  },
  {
    name: "Twi",
    code: "ak",
    country: { code: "GH", name: "Ghana", emoji: "🇬🇭" },
  },
  {
    name: "Udmurt",
    code: "udm",
    country: { code: "RU", name: "Russia", emoji: "🇷🇺" },
  },
  {
    name: "Ukrainian",
    code: "uk",
    country: { code: "UA", name: "Ukraine", emoji: "🇺🇦" },
  },
  {
    name: "Urdu",
    code: "ur",
    country: { code: "PK", name: "Pakistan", emoji: "🇵🇰" },
  },
  {
    name: "Uyghur",
    code: "ug",
    country: { code: "CN", name: "China", emoji: "🇨🇳" },
  },
  {
    name: "Uzbek",
    code: "uz",
    country: { code: "UZ", name: "Uzbekistan", emoji: "🇺🇿" },
  },
  {
    name: "Venda",
    code: "ve",
    country: { code: "ZA", name: "South Africa", emoji: "🇿🇦" },
  },
  {
    name: "Venetian",
    code: "vec",
    country: { code: "IT", name: "Italy", emoji: "🇮🇹" },
  },
  {
    name: "Vietnamese",
    code: "vi",
    country: { code: "VN", name: "Vietnam", emoji: "🇻🇳" },
  },
  {
    name: "Waray",
    code: "war",
    country: { code: "PH", name: "Philippines", emoji: "🇵🇭" },
  },
  {
    name: "Welsh",
    code: "cy",
    country: { code: "GB", name: "United Kingdom", emoji: "🇬🇧" },
  },
  {
    name: "Wolof",
    code: "wo",
    country: { code: "SN", name: "Senegal", emoji: "🇸🇳" },
  },
  {
    name: "Xhosa",
    code: "xh",
    country: { code: "ZA", name: "South Africa", emoji: "🇿🇦" },
  },
  {
    name: "Yakut",
    code: "sah",
    country: { code: "RU", name: "Russia", emoji: "🇷🇺" },
  },
  {
    name: "Yiddish",
    code: "yi",
    country: { code: "IL", name: "Israel", emoji: "🇮🇱" },
  },
  {
    name: "Yoruba",
    code: "yo",
    country: { code: "NG", name: "Nigeria", emoji: "🇳🇬" },
  },
  {
    name: "Yucatec Maya",
    code: "yua",
    country: { code: "MX", name: "Mexico", emoji: "🇲🇽" },
  },
  {
    name: "Zapotec",
    code: "zap",
    country: { code: "MX", name: "Mexico", emoji: "🇲🇽" },
  },
  {
    name: "Zulu",
    code: "zu",
    country: { code: "ZA", name: "South Africa", emoji: "🇿🇦" },
  },
];
