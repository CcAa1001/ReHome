import { navigate } from "../router.js";
import { showToast } from "../ui.js";

export function renderCurated() {
  const uploadInput = document.getElementById("ai-photo-upload");
  const uploadBox = document.getElementById("ai-upload-box");
  const previewImg = document.getElementById("ai-image-preview");
  const btnValuation = document.getElementById("btn-get-valuation");
  const btnText = document.getElementById("btn-valuation-text");
  const btnIcon = document.getElementById("btn-valuation-icon");
  const resultPanel = document.getElementById("ai-result-panel");
  const scanOverlay = document.getElementById("ai-scan-overlay");
  const scanText = document.getElementById("ai-scan-text");
  const geminiBadge = document.getElementById("gemini-badge");
  
  let currentFileBase64 = null;
  let isScanComplete = false;
  let generatedData = null;

  const apiKey = localStorage.getItem("rehome_gemini_key");
  if (apiKey) {
    if (geminiBadge) geminiBadge.style.display = "flex";
  }

  if (uploadInput) {
    uploadInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
          currentFileBase64 = ev.target.result;
          previewImg.src = currentFileBase64;
          previewImg.style.display = "block";
          
          btnValuation.style.opacity = "1";
          btnValuation.style.pointerEvents = "auto";
          btnText.textContent = "Get AI Valuation";
          isScanComplete = false;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (uploadBox) {
    uploadBox.addEventListener("dragover", e => { e.preventDefault(); uploadBox.style.borderColor = "#3d5a30"; });
    uploadBox.addEventListener("dragleave", e => { uploadBox.style.borderColor = "#c8c6c0"; });
    uploadBox.addEventListener("drop", e => {
      e.preventDefault();
      uploadBox.style.borderColor = "#c8c6c0";
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        uploadInput.files = e.dataTransfer.files;
        uploadInput.dispatchEvent(new Event('change'));
      }
    });
  }

  if (btnValuation) {
    btnValuation.addEventListener("click", async () => {
      if (isScanComplete) {
        // Navigate to sell
        localStorage.setItem('rehome_resell_data', JSON.stringify(generatedData));
        navigate("new-listing");
        return;
      }

      // Start scan
      btnValuation.disabled = true;
      btnValuation.style.opacity = "0.5";
      btnText.textContent = "Analyzing...";
      
      scanOverlay.style.display = "flex";
      scanOverlay.style.opacity = "1";
      
      const steps = ["Analyzing geometric structures...", "Cross-referencing global auctions...", "Calculating material quality...", "Computing Earth Credit..."];
      let stepIdx = 0;
      const interval = setInterval(() => {
        stepIdx = (stepIdx + 1) % steps.length;
        scanText.textContent = steps[stepIdx];
      }, 800);

      try {
        if (apiKey) {
          generatedData = await callGeminiAPI(apiKey, currentFileBase64);
        } else {
          await new Promise(r => setTimeout(r, 3500));
          generatedData = generateMockData();
        }

        clearInterval(interval);
        scanOverlay.style.display = "none";
        
        // Update DOM
        document.getElementById("ai-price-value").textContent = "$" + generatedData.price.toLocaleString();
        
        if (document.getElementById("ai-price-accuracy-title")) {
          document.getElementById("ai-price-accuracy-title").textContent = generatedData.estimated_fair_price ? "Fair Price: $" + generatedData.estimated_fair_price.toLocaleString() : "Excellent Fair Price";
          document.getElementById("ai-price-accuracy-desc").textContent = generatedData.price_accuracy_note || "Within 3% of market average.";
        }
        if (document.getElementById("ai-market-sentiment")) {
          document.getElementById("ai-market-sentiment").textContent = generatedData.market_sentiment || "Strong Demand";
        }
        if (document.getElementById("ai-insight-1-title") && generatedData.market_insights?.length > 0) {
          const parts = generatedData.market_insights[0].split(":");
          document.getElementById("ai-insight-1-title").textContent = parts[0] || "Appreciating Value";
          document.getElementById("ai-insight-1-desc").textContent = parts[1] || "+12% vs last year";
        }
        if (document.getElementById("ai-insight-2-title") && generatedData.market_insights?.length > 1) {
          const parts = generatedData.market_insights[1].split(":");
          document.getElementById("ai-insight-2-title").textContent = parts[0] || "Fast Turnover";
          document.getElementById("ai-insight-2-desc").textContent = parts[1] || "Avg. 4 days to sell";
        }
        if (document.getElementById("ai-eco-score")) {
          document.getElementById("ai-eco-score").textContent = "Eco-Check Score: " + (generatedData.eco_score || 98) + "/100";
          document.getElementById("ai-eco-offset").textContent = "Reselling this item offsets " + (generatedData.eco_offset || 45) + "kg of CO2.";
        }
        
        resultPanel.style.filter = "blur(0)";
        resultPanel.style.opacity = "1";
        resultPanel.style.pointerEvents = "auto";

        btnValuation.disabled = false;
        btnValuation.style.opacity = "1";
        btnText.textContent = "List Item Now";
        btnIcon.innerHTML = `<path d="M12 5v14M5 12h14"></path>`; // Plus icon
        isScanComplete = true;

        showToast("Valuation complete!");

      } catch (err) {
        clearInterval(interval);
        scanOverlay.style.display = "none";
        btnValuation.disabled = false;
        btnValuation.style.opacity = "1";
        btnText.textContent = "Get AI Valuation";
        showToast(err.message || "Valuation failed.");
      }
    });
  }

  async function callGeminiAPI(key, base64Image) {
    // Check available models first to avoid 404s depending on the user's region/key
    let targetModel = "gemini-1.5-flash";
    try {
      const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        const availableModels = modelsData.models.map(m => m.name);
        console.log("Available Gemini models:", availableModels);
        if (availableModels.includes("models/gemini-1.5-flash")) targetModel = "gemini-1.5-flash";
        else if (availableModels.includes("models/gemini-1.5-pro")) targetModel = "gemini-1.5-pro";
        else if (availableModels.includes("models/gemini-1.0-pro-vision-latest")) targetModel = "gemini-1.0-pro-vision-latest";
        else if (availableModels.length > 0) targetModel = availableModels[0].replace("models/", "");
      }
    } catch (e) {
      console.warn("Could not fetch models list, defaulting to gemini-1.5-flash");
    }

    console.log("Using model:", targetModel);

    const base64Data = base64Image.split(',')[1];
    const category = document.querySelectorAll(".ai-input")[0]?.value || 'Furniture';
    const condition = document.querySelectorAll(".ai-input")[1]?.value || 'Good';

    const prompt = `You are an expert luxury furniture appraiser. Analyze this image. 
    Category: ${category}. Condition: ${condition}. 
    Return ONLY a raw JSON object with no markdown formatting. The JSON must have these exact keys:
    {
      "title": "A short, elegant title for the item",
      "price": 1250,
      "description": "A sophisticated 2-sentence description of the item and its design legacy.",
      "maker": "Designer or Brand",
      "category": "${category}",
      "condition": "${condition}",
      "estimated_fair_price": 1200,
      "price_accuracy_note": "A short note like 'Within 3% of market average'",
      "market_sentiment": "Short sentiment phrase like 'Strong Demand' or 'Steady'",
      "market_insights": ["Insight 1 Title: Insight 1 Description", "Insight 2 Title: Insight 2 Description"],
      "eco_score": 95,
      "eco_offset": 45
    }`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        }]
      })
    });

    if (!response.ok) {
       const err = await response.json();
       throw new Error("Gemini API Error: " + (err.error?.message || "Unknown error"));
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Clean markdown
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    parsed.image_url = base64Image;
    return parsed;
  }

  function generateMockData() {
    const category = document.querySelectorAll(".ai-input")[0]?.value || 'Furniture';
    const condition = document.querySelectorAll(".ai-input")[1]?.value || 'Good';
    
    const titles = ["Mid-Century Teak Lounge", "Postmodern Ceramic Vessel", "Brutalist Steel Lamp", "Minimalist Oak Sideboard"];
    const makers = ["Knoll", "Herman Miller", "Foscarini", "Vitra", "Artemide"];
    
    return {
      title: titles[Math.floor(Math.random() * titles.length)],
      price: Math.floor(Math.random() * 4000) + 500,
      description: "A stunning example of enduring design. This piece combines exceptional craftsmanship with timeless aesthetic appeal, perfect for the modern collector.",
      maker: makers[Math.floor(Math.random() * makers.length)],
      category: category,
      condition: condition,
      estimated_fair_price: Math.floor(Math.random() * 4000) + 400,
      price_accuracy_note: "Within 5% of recent auction averages.",
      market_sentiment: "High Collector Interest",
      market_insights: ["Vintage Premium: Values up 8% this quarter", "Quick Sale: Average time on market 6 days"],
      eco_score: Math.floor(Math.random() * 15) + 85,
      eco_offset: Math.floor(Math.random() * 50) + 20,
      image_url: currentFileBase64
    };
  }
}