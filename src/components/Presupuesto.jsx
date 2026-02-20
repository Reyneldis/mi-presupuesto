// src/components/Presupuesto.jsx
import { useState } from 'react';

export default function Presupuesto() {
  // Inicializamos el estado leyendo directamente de localStorage
  // Al usar client:only, esto se ejecuta solo en el navegador y es seguro
  const [salario, setSalario] = useState(() => {
    const saved = localStorage.getItem('salario');
    return saved ? Number(saved) : 0;
  });

  const [gastos, setGastos] = useState(() => {
    const saved = localStorage.getItem('gastos');
    return saved ? JSON.parse(saved) : [];
  });

  // Estados del formulario
  const [inputSalario, setInputSalario] = useState('');
  const [nombreGasto, setNombreGasto] = useState('');
  const [peso, setPeso] = useState('');
  const [unidad, setUnidad] = useState('lbs');
  const [costo, setCosto] = useState('');

  // Funciones
  const guardarSalario = () => {
    const numero = Number(inputSalario);
    if (numero > 0) {
      setSalario(numero);
      localStorage.setItem('salario', numero);
      setInputSalario('');
    }
  };

  const agregarGasto = e => {
    e.preventDefault();
    if (!nombreGasto || !costo) return;

    const nuevoGasto = {
      id: Date.now(),
      nombre: nombreGasto,
      peso: peso,
      unidad: unidad,
      costo: Number(costo),
    };

    const nuevosGastos = [...gastos, nuevoGasto];
    setGastos(nuevosGastos);
    localStorage.setItem('gastos', JSON.stringify(nuevosGastos));

    // Limpiar formulario
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

  // Cálculos
  const totalGastado = gastos.reduce((acc, g) => acc + g.costo, 0);
  const restante = salario - totalGastado;

  const porcentaje = salario > 0 ? (totalGastado / salario) * 100 : 0;
  let colorBarra = 'bg-green-500';
  if (porcentaje > 50) colorBarra = 'bg-yellow-500';
  if (porcentaje > 80) colorBarra = 'bg-red-500';

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-md space-y-6 font-sans">
      {/* Pantalla para definir salario si es 0 */}
      {salario === 0 ? (
        <div className="text-center space-y-4">
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
        /* Dashboard principal */
        <>
          {/* Header Saldo */}
          <div className="text-center border-b pb-4">
            <p className="text-gray-500 uppercase tracking-wider text-sm">
              Salario Mensual
            </p>
            <h1 className="text-4xl font-extrabold text-gray-800">
              ${salario.toLocaleString('es-ES')}
            </h1>
          </div>

          {/* Barra de Progreso */}
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

          {/* Formulario Agregar Gasto */}
          <form
            onSubmit={agregarGasto}
            className="space-y-3 bg-gray-50 p-4 rounded-lg border"
          >
            <h3 className="font-bold text-lg text-gray-700">Agregar Compra</h3>

            <input
              type="text"
              placeholder="Producto (Ej: Arroz, Aceite)"
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
                <option value="lbs">Libras (lbs)</option>
                <option value="kgs">Kilos (kgs)</option>
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

          {/* Lista de Gastos */}
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
                    -${gasto.costo.toLocaleString('es-ES')}
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

          {/* Botón Reiniciar */}
          <button
            onClick={() => {
              if (window.confirm('¿Ya empezó un nuevo mes? ¿Borramos todo?')) {
                localStorage.clear();
                setSalario(0);
                setGastos([]);
              }
            }}
            className="w-full text-gray-400 text-sm hover:text-gray-600 underline mt-8"
          >
            Reiniciar mes
          </button>
        </>
      )}
    </div>
  );
}
