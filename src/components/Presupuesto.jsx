// src/components/Presupuesto.jsx
import { useState } from 'react';

export default function Presupuesto() {
  // --- SEGURIDAD ---
  const [pinGuardado, setPinGuardado] = useState(
    () => localStorage.getItem('app_pin') || null,
  );
  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorPin, setErrorPin] = useState(false);
  const [creandoPin, setCreandoPin] = useState(
    !localStorage.getItem('app_pin'),
  ); // Si no hay pin, pedir crearlo

  const verificarPin = () => {
    if (pinInput === pinGuardado) {
      setIsUnlocked(true);
      setErrorPin(false);
    } else {
      setErrorPin(true);
    }
  };

  const crearPin = () => {
    if (pinInput.length >= 4) {
      localStorage.setItem('app_pin', pinInput);
      setPinGuardado(pinInput);
      setIsUnlocked(true);
      setCreandoPin(false);
    } else {
      alert('El PIN debe tener al menos 4 números');
    }
  };

  // Pantalla de Seguridad (Bloqueo)
  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center w-full max-w-sm space-y-6">
          <div className="text-6xl">🔐</div>
          <h2 className="text-2xl font-bold text-gray-700">
            {creandoPin ? 'Crea tu PIN de Seguridad' : 'Ingresa tu PIN'}
          </h2>

          <input
            type="password"
            inputMode="numeric"
            maxLength="6"
            placeholder="****"
            value={pinInput}
            onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))} // Solo números
            className="w-full text-center text-3xl tracking-widest p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />

          {errorPin && (
            <p className="text-red-500 font-bold text-sm">❌ PIN incorrecto</p>
          )}

          <button
            onClick={creandoPin ? crearPin : verificarPin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            {creandoPin ? 'Guardar PIN' : 'Desbloquear'}
          </button>
        </div>
      </div>
    );
  }

  // --- APP PRINCIPAL (Solo visible si isUnlocked es true) ---

  const leerStorage = (clave, valorPorDefecto) => {
    try {
      const guardado = localStorage.getItem(clave);
      return guardado ? JSON.parse(guardado) : valorPorDefecto;
    } catch (e) {
      return valorPorDefecto;
    }
  };

  const [salario, setSalario] = useState(() => leerStorage('salario', 0));
  const [gastos, setGastos] = useState(() => leerStorage('gastos', []));

  const [inputSalario, setInputSalario] = useState('');
  const [nombreGasto, setNombreGasto] = useState('');
  const [peso, setPeso] = useState('');
  const [unidad, setUnidad] = useState('lbs');
  const [costo, setCosto] = useState('');

  const guardarSalario = () => {
    const numero = Number(inputSalario);
    if (numero > 0) {
      setSalario(numero);
      localStorage.setItem('salario', String(numero));
      setInputSalario('');
    }
  };

  const agregarGasto = e => {
    e.preventDefault();
    if (!nombreGasto || !costo) return;
    const nuevoGasto = {
      id: Date.now(),
      nombre: nombreGasto,
      peso,
      unidad,
      costo: Number(costo),
    };
    const nuevosGastos = [...gastos, nuevoGasto];
    setGastos(nuevosGastos);
    localStorage.setItem('gastos', JSON.stringify(nuevosGastos));
    setNombreGasto('');
    setPeso('');
    setCosto('');
    setUnidad('lbs');
  };

  const eliminarGasto = id => {
    const nuevosGastos = gastos.filter(g => g.id !== id);
    setGastos(nuevosGastos);
    localStorage.setItem('gastos', JSON.stringify(nuevosGastos));
  };

  const reiniciarApp = () => {
    if (window.confirm('¿Seguro que quieres borrar TODO y empezar de nuevo?')) {
      localStorage.clear();
      setSalario(0);
      setGastos([]);
      setIsUnlocked(false); // Regresa al login
      setPinGuardado(null); // Borra el pin
    }
  };

  const totalGastado = gastos.reduce(
    (acc, g) => acc + (Number(g.costo) || 0),
    0,
  );
  const restante = salario - totalGastado;
  const porcentaje = salario > 0 ? (totalGastado / salario) * 100 : 0;

  let colorBarra = 'bg-green-500';
  if (porcentaje > 50) colorBarra = 'bg-yellow-500';
  if (porcentaje > 80) colorBarra = 'bg-red-500';

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-md space-y-6 font-sans relative">
      {/* Botón Cerrar Sesión */}
      <button
        onClick={() => setIsUnlocked(false)}
        className="absolute top-4 right-4 text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-300 transition"
      >
        🔒 Bloquear
      </button>

      {salario === 0 ? (
        <div className="text-center space-y-4 pt-8">
          <h2 className="text-2xl font-bold text-gray-700">
            ¿Cuánto cobras este mes?
          </h2>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Ej: 1500"
              value={inputSalario}
              onChange={e => setInputSalario(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={guardarSalario}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              Definir
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center border-b pb-4">
            <p className="text-gray-500 uppercase tracking-wider text-sm">
              Salario Mensual
            </p>
            <h1 className="text-4xl font-extrabold text-gray-800">
              ${salario.toLocaleString('es-ES')}
            </h1>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Gastado: ${totalGastado.toLocaleString('es-ES')}</span>
              <span
                className={restante < 0 ? 'text-red-600' : 'text-green-600'}
              >
                Disponible: ${restante.toLocaleString('es-ES')}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${colorBarra}`}
                style={{ width: `${Math.min(porcentaje, 100)}%` }}
              ></div>
            </div>
            {restante < 0 && (
              <p className="text-red-600 font-bold text-center">
                ⚠️ ¡Te has pasado del presupuesto!
              </p>
            )}
          </div>

          <form
            onSubmit={agregarGasto}
            className="space-y-3 bg-gray-50 p-4 rounded-lg border"
          >
            <h3 className="font-bold text-lg text-gray-700">Agregar Compra</h3>
            <input
              type="text"
              placeholder="Producto (Ej: Arroz)"
              value={nombreGasto}
              onChange={e => setNombreGasto(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Cantidad"
                value={peso}
                onChange={e => setPeso(e.target.value)}
                className="w-1/2 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <select
                value={unidad}
                onChange={e => setUnidad(e.target.value)}
                className="w-1/2 p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="lbs">Libras</option>
                <option value="kgs">Kilos</option>
                <option value="unidades">Unidades</option>
                <option value="litros">Litros</option>
              </select>
            </div>
            <input
              type="number"
              placeholder="Costo Total ($)"
              value={costo}
              onChange={e => setCosto(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white p-2 rounded font-bold hover:bg-indigo-700 transition"
            >
              + Añadir Gasto
            </button>
          </form>

          <div className="space-y-2">
            {gastos.map(gasto => (
              <div
                key={gasto.id}
                className="flex justify-between items-center bg-white p-3 border rounded-lg shadow-sm"
              >
                <div>
                  <p className="font-medium text-gray-800">{gasto.nombre}</p>
                  {gasto.peso && (
                    <p className="text-xs text-gray-500">
                      Cantidad: {gasto.peso} {gasto.unidad}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-red-500 font-bold">
                    -${(Number(gasto.costo) || 0).toLocaleString('es-ES')}
                  </p>
                  <button
                    type="button"
                    onClick={() => eliminarGasto(gasto.id)}
                    className="text-gray-400 hover:text-red-600 transition text-xl"
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={reiniciarApp}
            className="w-full text-gray-400 text-sm hover:text-gray-600 underline mt-8"
          >
            Reiniciar App y Borrar Datos
          </button>
        </>
      )}
    </div>
  );
}
