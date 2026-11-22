// ============================================
// بورصة ساحل - BOURSA SAHEL - ملف الإعدادات الوحيد
// عدّل هذا الملف فقط، وكل المنصة ستتغير معه
// ============================================

window.SAHEL_CONFIG = {
  // --- 1. ربط Supabase - معلوماتك الحقيقية ---
  supabaseUrl: "https://wxoxfjlzuehfosdfojwi.supabase.co",
  supabaseAnonKey: "sb_publishable_DfsvyO4rFKguCU2W5y0wJQ__tGo0usN",

  // --- 2. معلومات البورصة ---
  brandName: "بورصة ساحل",
  brandNameEn: "BOURSA SAHEL",
  city: "نواكشوط - موريتانيا",
  whatsapp: "22220272057",
  phone: "22220272057",
  email: "admin@boursa.com",
  mapUrl: "https://maps.google.com/?q=نواكشوط",

  // --- 3. إعدادات المنصة ---
  maxImages: 20,
  maxVideoSizeMB: 50,
  currency: "MRU",
  enableVINCheck: true,
  enableTracking: true,
  enableReports: true,

  // --- 4. حاسبة الجمركة - نسب تقديرية ---
  customsRates: {
    age0_2: 0.35,
    age3_5: 0.28,
    age6plus: 0.18
  },

  // --- 5. صورة بديلة عند عدم وجود صورة ---
  fallbackImage: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80"
};

window.getSupabase = function(){
  if(!window.supabase) return null;
  if(!window.SAHEL_CONFIG.supabaseUrl || window.SAHEL_CONFIG.supabaseUrl.includes("YOUR_PROJECT")){
    console.warn("لم يتم ربط Supabase بعد - عدّل config.js");
    return null;
  }
  if(!window._supabaseClient){
    window._supabaseClient = window.supabase.createClient(
      window.SAHEL_CONFIG.supabaseUrl,
      window.SAHEL_CONFIG.supabaseAnonKey
    );
  }
  return window._supabaseClient;
};

window.openWhatsApp = function(message){
  const msg = encodeURIComponent(message || "أهلا بورصة ساحل، أريد الاستفسار عن السيارات");
  window.open(`https://wa.me/${window.SAHEL_CONFIG.whatsapp}?text=${msg}`, '_blank');
};
