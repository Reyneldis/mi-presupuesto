// src/components/Presupuesto.jsx
import { useState, useEffect } from 'react';
import sha256 from 'crypto-js/sha256';
// IMPORTACIÓN CORREGIDA PARA PDF (Forma directa)
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- FORMULARIO ---
const FormularioGasto = ({ nombreGasto, setNombreGasto, peso, setPeso, unidad, setUnidad, costo, setCosto, agregarGasto }) => (
  <form onSubmit={agregarGasto} className="space-y-4 p-6 bg-white dark:bg-gray-800">
      <div className="text-center mb-4">
          <span className="text-4xl">🛒</span>
          <h3 className="font-bold text-xl dark:text-white mt-2">¿Qué compraste?</h3>
      </div>
      <input type="text" placeholder="Ej: Arroz, Aceite..." value={nombreGasto} onChange={(e) => setNombreGasto(e.target.value)} className="w-full p-4 text-lg bg-gray-50 dark:bg-gray-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:text-white transition" required />
      <div className="grid grid-cols-3 gap-2">
          <input type="number" placeholder="Cant." value={peso} onChange={(e) => setPeso(e.target.value)} className="p-4 text-center text-lg bg-gray-50 dark:bg-gray-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:text-white"/>
          <select value={unidad} onChange={(e) => setUnidad(e.target.value)} className="p-4 text-center text-lg bg-gray-50 dark:bg-gray-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:text-white appearance-none">
              <option value="lbs">Lbs</option><option value="kgs">Kgs</option><option value="unidades">Uds</option><option value="litros">Lts</option><option value="ml">Ml</option>
          </select>
          <input type="number" placeholder="$$" value={costo} onChange={(e) => setCosto(e.target.value)} className="p-4 text-center text-lg bg-gray-50 dark:bg-gray-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:text-white font-bold" required/>
      </div>
      <button type="submit" className="w-full bg-indigo-600 text-white p-5 text-xl rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg active:scale-95 mt-4">GUARDAR</button>
  </form>
);

// --- MAIN ---
export default function Presupuesto() {
  const currentYear = new Date().getFullYear();
  const [isDark, setIsDark] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [periodo, setPeriodo] = useState('mes'); // 'mes', 'semana', 'todo'

  useEffect(() => { if (document.documentElement.classList.contains('dark')) setIsDark(true); }, []);
  const toggleDarkMode = () => { if (isDark) document.documentElement.classList.remove('dark'); else document.documentElement.classList.add('dark'); localStorage.setItem('theme', isDark ? 'light' : 'dark'); setIsDark(!isDark); };
  const leerStorage = (clave, valorPorDefecto) => { try { const g = localStorage.getItem(clave); return g ? JSON.parse(g) : valorPorDefecto; } catch (e) { return valorPorDefecto; } };

  const [pinGuardado, setPinGuardado] = useState(() => localStorage.getItem('app_pin') || null);
  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorPin, setErrorPin] = useState(false);
  const [creandoPin, setCreandoPin] = useState(!localStorage.getItem('app_pin'));

  const [salario, setSalario] = useState(() => leerStorage('salario', 0));
  const [gastos, setGastos] = useState(() => leerStorage('gastos', []));
  const [inputSalario, setInputSalario] = useState('');
  const [nombreGasto, setNombreGasto] = useState('');
  const [peso, setPeso] = useState('');
  const [unidad, setUnidad] = useState('lbs');
  const [costo, setCosto] = useState('');

  const olvidarPin = () => { if(window.confirm('⚠️ Se borrarán todos los datos para recuperar el acceso.')) { localStorage.clear(); setPinGuardado(null); setCreandoPin(true); setErrorPin(false); setPinInput(''); setSalario(0); setGastos([]); } }
  const verificarPin = () => { if (sha256(pinInput).toString() === pinGuardado) { setIsUnlocked(true); setErrorPin(false); setPinInput(''); } else { setErrorPin(true); } };
  const crearPin = () => { if (pinInput.length >= 4) { const h = sha256(pinInput).toString(); localStorage.setItem('app_pin', h); setPinGuardado(h); setIsUnlocked(true); setCreandoPin(false); } else { alert("Mínimo 4 números"); } };
  const guardarSalario = () => { const n = Number(inputSalario); if (n > 0) { setSalario(n); localStorage.setItem('salario', String(n)); setInputSalario(''); } };
  const agregarGasto = (e) => { e.preventDefault(); if (!nombreGasto || !costo) return; const ng = { id: Date.now(), nombre: nombreGasto, peso, unidad, costo: Number(costo) }; setGastos([ng, ...gastos]); localStorage.setItem('gastos', JSON.stringify([ng, ...gastos])); setNombreGasto(''); setPeso(''); setCosto(''); setIsModalOpen(false); };
  const eliminarGasto = (id) => { const n = gastos.filter(g => g.id !== id); setGastos(n); localStorage.setItem('gastos', JSON.stringify(n)); };
  const reiniciarApp = () => { if(window.confirm('¿Borrar todo?')) { localStorage.clear(); setSalario(0); setGastos([]); setIsUnlocked(false); setPinGuardado(null); setCreandoPin(true); } }

  // --- FILTRO DE FECHAS ---
  const gastosFiltrados = gastos.filter(g => {
    if (periodo === 'todo') return true;
    const fechaGasto = new Date(g.id);
    const ahora = new Date();
    
    if (periodo === 'mes') {
        return fechaGasto.getMonth() === ahora.getMonth() && fechaGasto.getFullYear() === ahora.getFullYear();
    }
    if (periodo === 'semana') {
        // Obtener inicio de semana (Lunes)
        const diaSemana = ahora.getDay(); // 0 (Dom) - 6 (Sab)
        const diff = ahora.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1); // Ajuste para empezar en Lunes
        const inicioSemana = new Date(ahora.setDate(diff));
        inicioSemana.setHours(0,0,0,0);
        return fechaGasto >= inicioSemana;
    }
    return true;
  });

  const totalGastadoFiltrado = gastosFiltrados.reduce((acc, g) => acc + (Number(g.costo) || 0), 0);

  // --- FUNCIÓN PDF (SINTAXIS CORREGIDA) ---
  const generarPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229);
      doc.text("FinanzaPro - Resumen", 14, 22);
      
      // Fecha
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 14, 30);
      
      // Resumen
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Salario: $${salario.toLocaleString('es-ES')}`, 14, 45);
      doc.text(`Gastado (periodo): $${totalGastadoFiltrado.toLocaleString('es-ES')}`, 14, 52);
      doc.text(`Restante: $${(salario - totalGastadoFiltrado).toLocaleString('es-ES')}`, 14, 59);
      
      // Tabla - USANDO LA NUEVA SINTAXIS
      autoTable(doc, {
          startY: 70,
          head: [['Producto', 'Cant.', 'Costo']],
          body: gastosFiltrados.map(g => [
            g.nombre, 
            g.peso ? `${g.peso} ${g.unidad}` : '-', 
            `$${g.costo}`
          ]),
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] }
      });

      doc.save(`MisGastos.pdf`);
      
    } catch (error) {
      console.error(error);
      alert("Error al generar PDF. Revisa consola.");
    }
  }

  // --- LOCK SCREEN ---
  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-900 dark:to-gray-950 p-4 transition-colors">
        <button onClick={toggleDarkMode} className="absolute top-6 right-6 z-50 text-2xl p-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-lg hover:scale-110 transition">{isDark ? '☀️' : '🌙'}</button>
        <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-2xl text-center w-full max-w-md border border-gray-200 dark:border-gray-700 flex-1 flex flex-col justify-center">
          <div className="mb-6 text-7xl">🔐</div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{creandoPin ? "Bienvenido" : "Hola de nuevo"}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">{creandoPin ? "Crea un PIN secreto" : "Pon tu PIN"}</p>
          <input type="password" inputMode="numeric" maxLength="6" placeholder="• • • •" value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} className="w-full text-center text-4xl tracking-[0.5em] p-4 border-0 border-b-4 border-gray-200 dark:border-gray-600 bg-transparent focus:outline-none focus:border-indigo-500 transition text-gray-800 dark:text-white mb-6"/>
          {errorPin && <p className="text-red-500 font-medium text-base mb-4">❌ Incorrecto</p>}
          <button onClick={creandoPin ? crearPin : verificarPin} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 text-xl rounded-2xl font-bold transition-all duration-300 shadow-lg">{creandoPin ? "CREAR PIN" : "ENTRAR"}</button>
          {!creandoPin && (<button onClick={olvidarPin} className="mt-6 text-sm text-gray-400 hover:text-red-500 transition underline">¿Olvidaste tu PIN?</button>)}
        </div>
        <footer className="text-center py-6 text-sm text-gray-500 dark:text-gray-400 mt-auto"><p>FinanzaPro © {currentYear}</p></footer>
      </div>
    );
  }

  // --- APP ---
  const totalGastado = gastos.reduce((acc, g) => acc + (Number(g.costo) || 0), 0);
  const restante = salario - totalGastado;
  const porcentaje = salario > 0 ? (totalGastado / salario) * 100 : 0;
  let colorBarra = 'bg-emerald-500'; if (porcentaje > 50) colorBarra = 'bg-amber-500'; if (porcentaje > 80) colorBarra = 'bg-rose-500';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-300 flex flex-col">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3 text-2xl font-bold text-indigo-600 dark:text-indigo-400"><span>💰</span> <span>FinanzaPro</span></div>
                <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition text-2xl">{isDark ? '☀️' : '🌙'}</button>
            </div>
        </header>
        <main className="flex-1 container mx-auto p-4 pb-24 md:pb-4">
            {salario === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full min-h-[70vh]">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border dark:border-gray-700 space-y-6">
                        <div className="text-6xl">👋</div><h2 className="text-3xl font-bold dark:text-white">¡Hola!</h2>
                        <p className="text-gray-500 dark:text-gray-300 text-lg">¿Cuánto dinero tienes este mes?</p>
                        <input type="number" placeholder="0.00" value={inputSalario} onChange={(e) => setInputSalario(e.target.value)} className="w-full p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl text-center text-4xl font-bold dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-300"/>
                        <button onClick={guardarSalario} className="w-full bg-indigo-600 text-white text-2xl p-5 rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg">COMENZAR ✨</button>
                    </div>
                 </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <aside className="hidden lg:block lg:col-span-4 space-y-6">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-2xl">
                            <p className="text-indigo-200 text-sm uppercase tracking-wider">Tu Salario</p><h1 className="text-5xl font-extrabold my-2">${salario.toLocaleString('es-ES')}</h1>
                            <div className="mt-6 bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                                <div className="flex justify-between text-lg mb-2"><span>Gastado</span><span className="font-bold">${totalGastado.toLocaleString('es-ES')}</span></div>
                                <div className="w-full bg-white/20 rounded-full h-3"><div className={`h-3 rounded-full ${colorBarra}`} style={{ width: `${Math.min(porcentaje, 100)}%` }}></div></div>
                                <p className="text-right mt-3 font-bold text-2xl">${restante.toLocaleString('es-ES')}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border dark:border-gray-700 overflow-hidden">
                           <FormularioGasto nombreGasto={nombreGasto} setNombreGasto={setNombreGasto} peso={peso} setPeso={setPeso} unidad={unidad} setUnidad={setUnidad} costo={costo} setCosto={setCosto} agregarGasto={agregarGasto} />
                        </div>
                    </aside>
                    <div className="lg:hidden bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border dark:border-gray-700 mb-4">
                        <div className="flex flex-col items-center">
                            <p className="text-gray-500 text-sm">Te queda</p>
                            <p className={`text-5xl font-extrabold my-2 ${restante < 0 ? 'text-red-500' : 'text-green-600'}`}>${restante.toLocaleString('es-ES')}</p>
                            <div className="w-full bg-gray-200 rounded-full h-3 mt-2"><div className={`h-3 rounded-full ${colorBarra}`} style={{ width: `${Math.min(porcentaje, 100)}%` }}></div></div>
                        </div>
                    </div>
                    <section className="lg:col-span-8">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border dark:border-gray-700 overflow-hidden">
                            {/* Header con Filtros */}
                            <div className="p-4 border-b dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-2">
                                <h3 className="font-bold text-xl dark:text-white">Mis Compras</h3>
                                
                                {/* BOTONES DE FILTRO */}
                                <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl text-xs">
                                    <button onClick={() => setPeriodo('semana')} className={`px-3 py-1 rounded-lg transition ${periodo === 'semana' ? 'bg-white dark:bg-gray-900 font-bold shadow' : 'opacity-70'}`}>Semana</button>
                                    <button onClick={() => setPeriodo('mes')} className={`px-3 py-1 rounded-lg transition ${periodo === 'mes' ? 'bg-white dark:bg-gray-900 font-bold shadow' : 'opacity-70'}`}>Mes</button>
                                    <button onClick={() => setPeriodo('todo')} className={`px-3 py-1 rounded-lg transition ${periodo === 'todo' ? 'bg-white dark:bg-gray-900 font-bold shadow' : 'opacity-70'}`}>Todo</button>
                                </div>

                                <div className="flex gap-2 items-center">
                                    {gastosFiltrados.length > 0 && (
                                        <button onClick={generarPDF} className="flex items-center gap-2 text-sm bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-bold shadow-md transition active:scale-95">
                                            📥 PDF
                                        </button>
                                    )}
                                    <button onClick={() => setIsUnlocked(false)} className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">🔒</button>
                                    <button onClick={reiniciarApp} className="text-xs text-gray-400 hover:text-red-500">🗑️</button>
                                </div>
                            </div>
                            
                            {/* Resumen del periodo seleccionado */}
                            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/30 text-sm text-gray-500 dark:text-gray-400">
                                Gastado en este periodo: <span className="font-bold text-gray-700 dark:text-white">${totalGastadoFiltrado.toLocaleString('es-ES')}</span>
                            </div>

                            <div className="divide-y dark:divide-gray-700 p-2">
                                {gastosFiltrados.length === 0 && (
                                    <div className="text-center py-20 text-gray-400">
                                        <div className="text-5xl mb-2">🛒</div>
                                        <p className="text-lg">Sin gastos en este periodo</p>
                                    </div>
                                )}
                                {gastosFiltrados.map(gasto => (
                                    <div key={gasto.id} className="group flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-2xl">🛍️</div>
                                            <div>
                                                <p className="font-bold text-lg dark:text-white">{gasto.nombre}</p>
                                                {gasto.peso && <p className="text-sm text-gray-400">{gasto.peso} {gasto.unidad}</p>}
                                                <p className="text-xs text-gray-400">{new Date(gasto.id).toLocaleDateString('es-ES')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-xl text-rose-500">-${(Number(gasto.costo) || 0).toLocaleString('es-ES')}</p>
                                            <button onClick={() => eliminarGasto(gasto.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition text-2xl">🗑️</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </main>
        <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-auto py-6">
            <div className="container mx-auto px-4 text-center">
                <div className="flex justify-center gap-4 text-3xl mb-3"><span>🔒</span><span>💰</span><span>🛡️</span></div>
                <h4 className="text-lg font-bold text-gray-700 dark:text-white">FinanzaPro</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tus finanzas seguras.</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">© {currentYear} Todos los derechos reservados.</p>
            </div>
        </footer>
        {salario > 0 && (<button onClick={() => setIsModalOpen(true)} className="lg:hidden fixed bottom-8 right-8 w-20 h-20 bg-indigo-600 rounded-full shadow-2xl shadow-indigo-500/40 text-white text-5xl flex items-center justify-center z-50 hover:scale-105 active:scale-95 transition border-4 border-white">+</button>)}
        {isModalOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end" onClick={() => setIsModalOpen(false)}>
                <div className="w-full bg-white dark:bg-gray-800 rounded-t-[2rem] max-h-[90vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                        <h3 className="font-bold text-xl dark:text-white">Agregar</h3>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 text-2xl">✖️</button>
                    </div>
                    <FormularioGasto nombreGasto={nombreGasto} setNombreGasto={setNombreGasto} peso={peso} setPeso={setPeso} unidad={unidad} setUnidad={setUnidad} costo={costo} setCosto={setCosto} agregarGasto={agregarGasto} />
                </div>
            </div>
        )}
        <style>{`@keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } } .animate-slide-up { animation: slide-up 0.3s ease-out; }`}</style>
    </div>
  );
}