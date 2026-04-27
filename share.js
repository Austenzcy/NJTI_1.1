(() => {
  const DATA = window.NJTI_DATA;
  const $ = (id) => document.getElementById(id);
  const EXTRA_UI = {
    zh: { loading: "正在读取分享结果……", missing: "分享链接缺少结果编号。", notFound: "没有找到这条分享结果，可能链接有误。", sharedTitle: "分享的 NJTI 人格是", takeTest: "我也要测", copyFailed: "复制失败，请手动复制。" },
    en: { loading: "Loading shared result...", missing: "This share link is missing a result id.", notFound: "Result not found. The link may be incorrect.", sharedTitle: "Shared NJTI type", takeTest: "Take the test", copyFailed: "Copy failed. Please copy manually." },
    fr: { loading: "Chargement du résultat...", missing: "Ce lien ne contient pas d’identifiant.", notFound: "Résultat introuvable.", sharedTitle: "Type NJTI partagé", takeTest: "Faire le test", copyFailed: "Copie impossible. Copie manuellement." },
    es: { loading: "Cargando resultado compartido...", missing: "Falta el ID del resultado.", notFound: "No se encontró el resultado.", sharedTitle: "Tipo NJTI compartido", takeTest: "Hacer el test", copyFailed: "No se pudo copiar. Cópialo manualmente." },
    ja: { loading: "共有結果を読み込み中……", missing: "共有リンクに結果IDがありません。", notFound: "この共有結果が見つかりません。", sharedTitle: "共有された NJTI 人格", takeTest: "自分も測る", copyFailed: "コピーに失敗しました。手動でコピーしてください。" },
    ko: { loading: "공유 결과를 불러오는 중...", missing: "공유 링크에 결과 ID가 없습니다.", notFound: "공유 결과를 찾을 수 없습니다.", sharedTitle: "공유된 NJTI 유형", takeTest: "나도 테스트하기", copyFailed: "복사에 실패했습니다. 직접 복사해 주세요." },
    ar: { loading: "جارٍ تحميل النتيجة...", missing: "رابط المشاركة يفتقد رقم النتيجة.", notFound: "لم يتم العثور على النتيجة.", sharedTitle: "نوع NJTI المُشارك", takeTest: "أجرِ الاختبار", copyFailed: "فشل النسخ. انسخ الرابط يدوياً." },
    ru: { loading: "Загружаем результат...", missing: "В ссылке нет ID результата.", notFound: "Результат не найден.", sharedTitle: "Поделились типом NJTI", takeTest: "Пройти тест", copyFailed: "Не удалось скопировать. Скопируйте вручную." }
  };
  const params = new URLSearchParams(location.search);
  const resultId = params.get("id");
  let lang = params.get("lang") || localStorage.getItem("njti_lang") || DATA.defaultLang || "zh";
  let record = null;

  const els = {
    languageSelect: $("languageSelect"),
    languageLabel: $("languageLabel"),
    loadingCard: $("loadingCard"),
    sharedResultCard: $("sharedResultCard"),
    loadingText: $("loadingText"),
    errorText: $("errorText"),
    takeTestLink: $("takeTestLink"),
    resultTitleLabel: $("resultTitleLabel"),
    resultName: $("resultName"),
    resultTraits: $("resultTraits"),
    resultImage: $("resultImage"),
    personaLabel: $("personaLabel"),
    detailLabel: $("detailLabel"),
    sceneLabel: $("sceneLabel"),
    dimensionProfileLabel: $("dimensionProfileLabel"),
    resultPersona: $("resultPersona"),
    resultDetail: $("resultDetail"),
    resultScene: $("resultScene"),
    dimensionChart: $("dimensionChart"),
    copyBtn: $("copyBtn"),
    homeBtn: $("homeBtn")
  };

  function tr(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return obj[lang] || obj.zh || obj.en || "";
  }
  function ui(key, values = {}) {
    let text = (DATA.ui[lang] && DATA.ui[lang][key]) || DATA.ui.zh[key] || "";
    Object.entries(values).forEach(([k, v]) => text = text.replace(`{${k}}`, v));
    return text;
  }
  function extra(key) {
    return (EXTRA_UI[lang] && EXTRA_UI[lang][key]) || EXTRA_UI.zh[key] || "";
  }

  function populateLanguageSelect() {
    els.languageSelect.innerHTML = "";
    DATA.languages.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item.code;
      opt.textContent = item.label;
      if (item.code === lang) opt.selected = true;
      els.languageSelect.appendChild(opt);
    });
  }

  function applyLanguage() {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = ui("siteTitle");
    els.languageLabel.textContent = ui("language");
    els.loadingText.textContent = extra("loading");
    els.takeTestLink.textContent = extra("takeTest");
    els.resultTitleLabel.textContent = extra("sharedTitle");
    els.personaLabel.textContent = ui("persona");
    els.detailLabel.textContent = ui("detail");
    els.sceneLabel.textContent = ui("scene");
    els.dimensionProfileLabel.textContent = ui("dimensionProfile");
    els.copyBtn.textContent = ui("copyLink");
    els.homeBtn.textContent = extra("takeTest");
    if (record) renderRecord();
  }

  function renderChart(percentages) {
    els.dimensionChart.innerHTML = "";
    DATA.dimensions.forEach(dim => {
      const p = percentages && percentages[dim.id] || { leftPct: 50, rightPct: 50 };
      const leftPct = Number(p.leftPct ?? 50);
      const rightPct = Number(p.rightPct ?? (100 - leftPct));
      const row = document.createElement("div");
      row.className = "metric-row";
      row.innerHTML = `
        <div class="metric-label left">
          <span>${tr(dim.left)}</span><span class="percent">${leftPct}%</span>
        </div>
        <div class="metric-bar" aria-label="${tr(dim.left)} ${leftPct}%, ${tr(dim.right)} ${rightPct}%">
          <span class="metric-fill-left" style="width:${leftPct}%"></span>
          <span class="metric-fill-right" style="width:${rightPct}%"></span>
          <span class="metric-center"></span>
        </div>
        <div class="metric-label right">
          <span>${tr(dim.right)}</span><span class="percent">${rightPct}%</span>
        </div>
      `;
      els.dimensionChart.appendChild(row);
    });
  }

  function renderRecord() {
    const result = DATA.results[record.dimension_code] || DATA.results[record.personality_id] || DATA.results.RLLL;
    els.resultName.textContent = tr(result.name) || record.personality_name;
    els.resultTraits.textContent = tr(result.traits);
    els.resultImage.src = result.image;
    els.resultImage.alt = tr(result.name) || record.personality_name;
    els.resultPersona.textContent = tr(result.persona);
    els.resultDetail.textContent = tr(result.detail);
    els.resultScene.textContent = tr(result.scene);
    renderChart(record.percentages);
    els.loadingCard.classList.add("hidden");
    els.sharedResultCard.classList.remove("hidden");
  }

  async function loadResult() {
    if (!resultId) {
      els.loadingText.textContent = extra("missing");
      return;
    }
    try {
      const res = await fetch(`/api/results?id=${encodeURIComponent(resultId)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Not found");
      record = data.result;
      if (!params.get("lang") && record.language) lang = record.language;
      localStorage.setItem("njti_lang", lang);
      populateLanguageSelect();
      applyLanguage();
      renderRecord();
    } catch (err) {
      console.error(err);
      els.loadingText.textContent = extra("notFound");
      els.errorText.textContent = err.message || "";
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      const old = els.copyBtn.textContent;
      els.copyBtn.textContent = ui("copied");
      setTimeout(() => els.copyBtn.textContent = old, 1200);
    } catch (_) {
      window.prompt(extra("copyFailed"), window.location.href);
    }
  }

  function init() {
    populateLanguageSelect();
    applyLanguage();
    els.languageSelect.addEventListener("change", (e) => {
      lang = e.target.value;
      localStorage.setItem("njti_lang", lang);
      const url = new URL(location.href);
      url.searchParams.set("lang", lang);
      history.replaceState(null, "", url.toString());
      applyLanguage();
    });
    els.copyBtn.addEventListener("click", copyLink);
    loadResult();
  }
  init();
})();
