/* ============================================================
   MOON 🌙 — طبقة البيانات (Data Layer) v2.0
   ============================================================ */
window.ANEQ = (function () {
  const USE_SB = !!(window.SUPABASE_URL && window.SUPABASE_KEY && window.supabase);
  const sb = USE_SB ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY) : null;

  const K = { products: 'moon_products', orders: 'moon_orders', settings: 'moon_settings', cart: 'moon_cart' };
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
  const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const DEF_SET = { storeName: 'MOON 🌙', currency: 'أوقية', whatsapp: '966500000000', password: 'admin123' };
  const DEF_PRODS = [
    { id:1, name:'سماعات لاسلكية احترافية', price:1990, old_price:2990, cat:'إلكترونيات', stock:45, emoji:'🎧', description:'عزل ضوضاء نشط', rate:4.8, images:[], video_url:null },
    { id:2, name:'ساعة ذكية Sport', price:3490, old_price:0, cat:'إلكترونيات', stock:12, emoji:'⌚', description:'تتبع صحة ولياقة', rate:4.9, images:[], video_url:null }
  ];

  if (!USE_SB) {
    if (lsGet(K.products) == null) lsSet(K.products, DEF_PRODS);
    if (lsGet(K.orders) == null) lsSet(K.orders, []);
    if (lsGet(K.settings) == null) lsSet(K.settings, DEF_SET);
  }

  /* ================== Products ================== */
  const products = {
    async list() {
      if (USE_SB) {
        const { data, error } = await sb.from('products').select('*').order('id', { ascending: false });
        if (error) throw error;
        return (data || []).map(p => ({ ...p, oldPrice: p.old_price }));
      }
      return lsGet(K.products, []);
    },
    async create(p) {
      const row = {
        name: p.name, cat: p.cat || 'عام', price: +p.price, old_price: +(p.oldPrice || 0),
        stock: +(p.stock || 0), rate: +(p.rate || 4.5), emoji: p.emoji || '📦',
        description: p.desc || '', images: p.images || [], video_url: p.video || null
      };
      if (USE_SB) {
        const { data, error } = await sb.from('products').insert(row).select().single();
        if (error) throw error;
        return data;
      }
      const arr = lsGet(K.products, []); const item = { ...row, id: Date.now() };
      arr.unshift(item); lsSet(K.products, arr); return item;
    },
    async update(id, patch) {
      const row = {
        name: patch.name, cat: patch.cat || 'عام', price: +patch.price, old_price: +(patch.oldPrice || 0),
        stock: +(patch.stock || 0), rate: +(patch.rate || 4.5), emoji: patch.emoji || '📦',
        description: patch.desc || '', images: patch.images || [], video_url: patch.video || null
      };
      if (USE_SB) {
        const { data, error } = await sb.from('products').update(row).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }
      const arr = lsGet(K.products, []); const i = arr.findIndex(x => x.id == id);
      if (i < 0) throw new Error('المنتج غير موجود');
      arr[i] = { ...arr[i], ...row }; lsSet(K.products, arr); return arr[i];
    },
    async remove(id) {
      if (USE_SB) {
        // حذف الملفات من المخزن أولاً
        try {
          const { data } = await sb.from('products').select('images, video_url').eq('id', id).single();
          if (data?.images?.length) {
            const paths = data.images.map(url => url.split('/product-images/')[1]).filter(Boolean);
            if (paths.length) await sb.storage.from('product-images').remove(paths);
          }
          if (data?.video_url) {
            const vp = data.video_url.split('/product-videos/')[1];
            if (vp) await sb.storage.from('product-videos').remove([vp]);
          }
        } catch (_) {}
        const { error } = await sb.from('products').delete().eq('id', id);
        if (error) throw error; return;
      }
      lsSet(K.products, lsGet(K.products, []).filter(x => x.id != id));
    }
  };

  /* ================== Storage (الصور والفيديو) ================== */
  const storage = {
    async uploadImage(file) {
      if (!USE_SB) {
        return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
      }
      const ext = file.name.split('.').pop().toLowerCase();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await sb.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (error) throw error;
      return sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
    },
    async uploadVideo(file) {
      if (!USE_SB) return storage.uploadImage(file);
      const ext = file.name.split('.').pop().toLowerCase();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await sb.storage.from('product-videos').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (error) throw error;
      return sb.storage.from('product-videos').getPublicUrl(path).data.publicUrl;
    }
  };

  /* ================== Orders ================== */
  const orders = {
    async list() {
      if (USE_SB) {
        const { data, error } = await sb.from('orders').select('*').order('id', { ascending: false });
        if (error) throw error;
        return (data || []).map(o => ({ ...o, total: Number(o.total), date: o.date || new Date(o.created_at).toLocaleString('ar-EG') }));
      }
      return lsGet(K.orders, []);
    },
    async create(payload) {
      if (USE_SB) {
        const { data, error } = await sb.rpc('create_order', {
          p_customer: payload.customer, p_phone: payload.phone, p_address: payload.address || '',
          p_notes: payload.notes || '', p_items: payload.items.map(i => ({ id: i.id, qty: i.qty }))
        });
        if (error) throw error; return data;
      }
      const total = payload.items.reduce((s, i) => s + i.price * i.qty, 0);
      const order = { id: Date.now(), customer: payload.customer, phone: payload.phone, address: payload.address, notes: payload.notes, items: payload.items, total, status: 'جديد', date: new Date().toLocaleString('ar-EG') };
      const arr = lsGet(K.orders, []); arr.unshift(order); lsSet(K.orders, arr);
      return order;
    },
    async update(id, patch) {
      if (USE_SB) {
        const { data, error } = await sb.from('orders').update(patch).eq('id', id).select().single();
        if (error) throw error; return data;
      }
      const arr = lsGet(K.orders, []); const i = arr.findIndex(x => x.id == id);
      arr[i] = { ...arr[i], ...patch }; lsSet(K.orders, arr); return arr[i];
    },
    async remove(id) {
      if (USE_SB) {
        const { error } = await sb.from('orders').delete().eq('id', id);
        if (error) throw error; return;
      }
      lsSet(K.orders, lsGet(K.orders, []).filter(x => x.id != id));
    }
  };

  /* ================== Settings & Stats & Auth ================== */
  const settings = {
    async get() {
      if (USE_SB) {
        const { data, error } = await sb.from('settings').select('data').eq('id', 1).maybeSingle();
        if (error) throw error; return { ...DEF_SET, ...(data?.data || {}) };
      }
      return { ...DEF_SET, ...lsGet(K.settings, {}) };
    },
    async save(patch) {
      if (USE_SB) {
        const cur = await this.get(); const next = { ...cur, ...patch };
        const { data, error } = await sb.from('settings').update({ data: next }).eq('id', 1).select().single();
        if (error) throw error; return { ...DEF_SET, ...data.data };
      }
      const s = { ...DEF_SET, ...lsGet(K.settings, {}), ...patch }; lsSet(K.settings, s); return s;
    }
  };

  async function stats() {
    if (USE_SB) {
      const { data, error } = await sb.rpc('aneq_stats'); if (error) throw error; return data;
    }
    const p = lsGet(K.products, []), o = lsGet(K.orders, []);
    return { sales: o.reduce((s, x) => s + (+x.total || 0), 0), orders: o.length, products: p.length, lowStock: p.filter(x => +x.stock <= 5).length, pending: o.filter(x => x.status === 'جديد').length };
  }

  const auth = {
    async signIn(email, password) {
      if (USE_SB) {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error; return data;
      }
      if (password === (await settings.get()).password) { sessionStorage.setItem('moon_admin', '1'); return { user: { id: 'local', email: 'local' } }; }
      throw new Error('كلمة المرور غير صحيحة');
    },
    async signOut() { if (USE_SB) return sb.auth.signOut(); sessionStorage.removeItem('moon_admin'); },
    async getUser() {
      if (USE_SB) { const { data } = await sb.auth.getUser(); return data.user || null; }
      return sessionStorage.getItem('moon_admin') === '1' ? { id: 'local', email: 'local' } : null;
    },
    onChange(cb) { if (USE_SB) sb.auth.onAuthStateChange((_e, s) => cb(s?.user || null)); }
  };

  const cart = { get: () => lsGet(K.cart, []), set: v => lsSet(K.cart, v) };

  return { ONLINE: USE_SB, products, orders, settings, stats, auth, cart, storage };
})();