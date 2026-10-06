'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function FooderiaSecureApp() {
  const [user, setUser] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const [menus, setMenus] = useState<any[]>([]);
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total_transaksi: 0, total_omset: 0 });
  const [activeTab, setActiveTab] = useState('pos');

  const [cart, setCart] = useState<any[]>([]);
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [metodeBayar, setMetodeBayar] = useState('QRIS');
  
  const [uangTunaiDisplay, setUangTunaiDisplay] = useState('');
  const [uangTunaiNilai, setUangTunaiNilai] = useState(0);

  // State Form Menu Baru (Harga Display & Harga Nilai Asli)
  const [formMenu, setFormMenu] = useState({ nama: '', kategori: 'Makanan Utama', stok: '', status: 'Tersedia', icon: '🍲' });
  const [hargaMenuDisplay, setHargaMenuDisplay] = useState('');
  const [hargaMenuNilai, setHargaMenuNilai] = useState(0);

  const formatRupiahDisplay = (angka: number) => {
    return new Intl.NumberFormat('id-ID').format(angka);
  };

  const formatRupiahInput = (angka: string) => {
    const numberString = angka.replace(/[^,\d]/g, '').toString();
    const split = numberString.split(',');
    let sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    let ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
      let separator = sisa ? '.' : '';
      rupiah += separator + ribuan.join('.');
    }

    return split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
  };

  const handleUangTunaiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '');
    if (!isNaN(Number(rawValue))) {
      setUangTunaiDisplay(formatRupiahInput(rawValue));
      setUangTunaiNilai(Number(rawValue));
    }
  };

  const handleHargaMenuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '');
    if (!isNaN(Number(rawValue))) {
      setHargaMenuDisplay(formatRupiahInput(rawValue));
      setHargaMenuNilai(Number(rawValue));
    }
  };

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setActiveTab('pos');
        fetchData();
        showNotification(`Selamat datang kembali, ${data.user.nama}!`);
      } else {
        setLoginError(data.message || 'Login gagal');
      }
    } catch (err) {
      setLoginError('Terjadi kesalahan pada server');
    }
  };

  const fetchData = async () => {
    try {
      const [resMenu, resTrx, resStaff] = await Promise.all([
        fetch('/api/menu').then(res => res.json()),
        fetch('/api/transaksi').then(res => res.json()),
        fetch('/api/staff').then(res => res.json())
      ]);
      setMenus(resMenu.data || []);
      setTransaksi(resTrx.data || []);
      setSummary(resTrx.summary || { total_transaksi: 0, total_omset: 0 });
      setStaff(resStaff.data || []);
    } catch (err) {
      console.error("Gagal memuat data:", err);
    }
  };

  const isAdmin = user && (user.role.toLowerCase().includes('admin') || user.role.toLowerCase().includes('lead'));

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const totalCart = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);
  const kembalian = metodeBayar === 'Cash' ? uangTunaiNilai - totalCart : 0;

  const handleCheckout = async () => {
    if (!namaPelanggan || cart.length === 0) {
      showNotification("Masukkan nama pelanggan dan pilih minimal 1 menu!", "error");
      return;
    }

    if (metodeBayar === 'Cash' && uangTunaiNilai < totalCart) {
      showNotification("Uang tunai pembeli kurang dari total pembayaran!", "error");
      return;
    }

    const res = await fetch('/api/transaksi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pelanggan: namaPelanggan,
        total: totalCart,
        metode: metodeBayar,
        items: cart
      })
    });

    if (res.ok) {
      showNotification(`Transaksi Berhasil! Metode: ${metodeBayar}${metodeBayar === 'Cash' ? ` | Kembalian: Rp ${formatRupiahDisplay(kembalian)}` : ''}`);
      setCart([]);
      setNamaPelanggan('');
      setUangTunaiDisplay('');
      setUangTunaiNilai(0);
      fetchData();
    }
  };

  const handleSimpanMenu = async (e: any) => {
    e.preventDefault();
    if (!isAdmin) {
      showNotification("Akses Ditolak!", "error");
      return;
    }
    const res = await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formMenu,
        harga: hargaMenuNilai
      })
    });
    if (res.ok) {
      showNotification("Menu Baru Berhasil Disimpan ke Database!");
      setFormMenu({ nama: '', kategori: 'Makanan Utama', stok: '', status: 'Tersedia', icon: '🍲' });
      setHargaMenuDisplay('');
      setHargaMenuNilai(0);
      fetchData();
      setActiveTab('pos');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative">
        {notification && (
          <div className={`fixed top-6 z-50 px-6 py-3.5 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-3 transition-all animate-bounce ${notification.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' : 'bg-red-950/90 border-red-500/30 text-red-300'}`}>
            <span>{notification.type === 'success' ? '✨' : '⚠️'}</span>
            {notification.message}
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl">
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="relative w-16 h-16 mb-3">
              <Image src="/logo.png" alt="Logo Fooderia" fill className="object-contain" priority />
            </div>
            <h1 className="text-2xl font-black text-white mt-1">FOODERIA PORTAL</h1>
            <p className="text-xs text-slate-400 mt-1">Silakan login sesuai hak akses</p>
          </div>

          {loginError && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-2xl text-center font-semibold flex items-center justify-center gap-2">
              <span>⚠️</span> {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Username</label>
              <input type="text" required value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} placeholder="admin atau kasir" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
              <input type="password" required value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} placeholder="••••••" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500" />
            </div>
            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all mt-2">
              Masuk ke Sistem
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
            <p>💡 Password default: <code className="text-orange-400">123</code></p>
            <p className="mt-1">Akun Admin: <code className="text-orange-400">admin</code> | Akun Kasir: <code className="text-orange-400">kasir</code></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 lg:p-10 relative">
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3.5 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-3 transition-all animate-bounce ${notification.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/30 text-emerald-300' : 'bg-red-950/95 border-red-500/30 text-red-300'}`}>
          <span>{notification.type === 'success' ? '✨' : '⚠️'}</span>
          {notification.message}
        </div>
      )}

      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 bg-slate-800 p-2 rounded-2xl border border-slate-700 flex items-center justify-center">
            <Image src="/logo.png" alt="Logo Fooderia" width={36} height={36} className="object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-wider bg-gradient-to-r from-orange-400 to-amber-200 bg-clip-text text-transparent">FOODERIA ENTERPRISE</h1>
            <p className="text-sm text-slate-400 mt-1">Sistem Terproteksi Role-Based Access Control (RBAC)</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-orange-600 flex items-center justify-center font-bold text-white text-xs">
              {user.nama.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-white">{user.nama}</p>
              <p className="text-[10px] text-orange-400 uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
          <button onClick={() => setUser(null)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all">
            Logout
          </button>
        </div>
      </header>

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-3xl shadow-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Omset Perusahaan</p>
            <p className="text-3xl font-black text-emerald-400 mt-2">Rp {formatRupiahDisplay(summary.total_omset)}</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-3xl shadow-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Transaksi Selesai</p>
            <p className="text-3xl font-black text-orange-400 mt-2">{summary.total_transaksi} <span className="text-sm text-slate-400 font-normal">Pesanan</span></p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-3xl shadow-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pegawai Aktif</p>
            <p className="text-3xl font-black text-indigo-400 mt-2">{staff.length} <span className="text-sm text-slate-400 font-normal">Orang</span></p>
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-8 overflow-x-auto">
        <button onClick={() => setActiveTab('pos')} className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'pos' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}>
          🛒 Kasir & Transaksi
        </button>

        {isAdmin && (
          <>
            <button onClick={() => setActiveTab('admin-report')} className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'admin-report' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}>
              📊 Laporan Pendapatan & Riwayat
            </button>
            <button onClick={() => setActiveTab('menu-manager')} className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'menu-manager' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}>
              ➕ Kelola Menu & Stok
            </button>
          </>
        )}
      </div>

      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-slate-800/45 border border-slate-800 p-6 rounded-3xl">
            <h2 className="text-lg font-bold mb-4 text-slate-200">Katalog Menu</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {menus.map((item: any) => (
                <div 
                  key={item.id} 
                  onClick={() => addToCart(item)} 
                  className="bg-slate-800 border border-slate-700/60 p-4 rounded-2xl cursor-pointer hover:border-orange-500 transition-all transform active:scale-95 duration-100 group"
                >
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <h3 className="font-bold text-sm text-slate-200">{item.nama}</h3>
                  <p className="text-orange-400 font-black text-sm mt-1">Rp {formatRupiahDisplay(item.harga)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-800/45 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold mb-4 text-slate-200">Keranjang Kasir</h2>
              
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Nama Pelanggan</label>
                  <input type="text" value={namaPelanggan} onChange={(e) => setNamaPelanggan(e.target.value)} placeholder="Contoh: Budi Santoso" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500" />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Metode Pembayaran</label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <button type="button" onClick={() => setMetodeBayar('QRIS')} className={`p-3 rounded-xl border text-sm font-bold transition-all ${metodeBayar === 'QRIS' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                      📱 QRIS
                    </button>
                    <button type="button" onClick={() => setMetodeBayar('Cash')} className={`p-3 rounded-xl border text-sm font-bold transition-all ${metodeBayar === 'Cash' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                      💵 Cash (Tunai)
                    </button>
                  </div>
                </div>

                {metodeBayar === 'Cash' && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Uang Tunai Diterima</label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-bold text-sm">Rp</span>
                      <input 
                        type="text" 
                        value={uangTunaiDisplay} 
                        onChange={handleUangTunaiChange} 
                        placeholder="50.000" 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-orange-500 font-semibold" 
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto mb-4 pr-1 border-t border-slate-800 pt-3">
                {cart.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">Keranjang masih kosong.</p>
                ) : (
                  cart.map((c, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <div>
                        <p className="font-bold text-xs">{c.nama}</p>
                        <p className="text-[10px] text-slate-400">{c.qty}x @ Rp {formatRupiahDisplay(c.harga)}</p>
                      </div>
                      <p className="font-bold text-xs text-orange-400">Rp {formatRupiahDisplay(c.harga * c.qty)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="border-t border-slate-800 pt-3 mb-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-400">Total Pembayaran</span>
                  <span className="text-xl font-black text-emerald-400">Rp {formatRupiahDisplay(totalCart)}</span>
                </div>
                {metodeBayar === 'Cash' && (
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-400">Uang Kembalian</span>
                    <span className={`text-base font-black ${kembalian >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                      {kembalian >= 0 ? `Rp ${formatRupiahDisplay(kembalian)}` : 'Uang Kurang!'}
                    </span>
                  </div>
                )}
              </div>

              <button onClick={handleCheckout} disabled={cart.length === 0 || (metodeBayar === 'Cash' && uangTunaiNilai < totalCart)} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 rounded-2xl transition-all">
                Proses Pembayaran (Checkout)
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'admin-report' && isAdmin && (
        <div className="bg-slate-800/45 border border-slate-800 p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-200">Riwayat & Rekapitulasi Pendapatan Global</h2>
            <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full border border-emerald-500/20 font-bold">
              Total Omset: Rp {formatRupiahDisplay(summary.total_omset)}
            </span>
          </div>

          <div className="space-y-3">
            {transaksi.map((trx: any) => (
              <div key={trx.id} className="bg-slate-800 border border-slate-700/60 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white text-sm">{trx.id_transaksi}</span>
                    <span className="bg-orange-500/10 text-orange-400 text-[10px] px-2 py-0.5 rounded font-semibold">{trx.metode}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Pelanggan: <strong className="text-slate-200">{trx.pelanggan}</strong> | {trx.waktu}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-400 text-base">Rp {formatRupiahDisplay(trx.total)}</p>
                  <span className="text-[10px] text-emerald-500 font-bold uppercase">{trx.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'menu-manager' && isAdmin && (
        <div className="max-w-2xl mx-auto bg-slate-800/45 border border-slate-800 p-8 rounded-3xl">
          <h2 className="text-xl font-bold mb-6 text-slate-200">Tambah Menu Baru ke Database</h2>
          <form onSubmit={handleSimpanMenu} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Nama Menu</label>
              <input type="text" required value={formMenu.nama} onChange={(e) => setFormMenu({...formMenu, nama: e.target.value})} placeholder="Cth: Es Teh Manis" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Harga (Rp)</label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-bold text-sm">Rp</span>
                  <input 
                    type="text" 
                    required 
                    value={hargaMenuDisplay} 
                    onChange={handleHargaMenuChange} 
                    placeholder="25.000" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-orange-500 font-semibold" 
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Stok Awal</label>
                <input type="number" required value={formMenu.stok} onChange={(e) => setFormMenu({...formMenu, stok: e.target.value})} placeholder="Cth: 100" className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500" />
              </div>
            </div>
            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-2xl mt-4 transition-all">
              Simpan ke Database
            </button>
          </form>
        </div>
      )}
    </div>
  );
}