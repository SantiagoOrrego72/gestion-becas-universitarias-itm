// ══════════════════════════════════════════════════════════════
//  STRATEGY — Evaluación de solicitudes
//
//  Problema: la lógica para determinar el estado de una solicitud
//  (APROBADO/RECHAZADO) cambia según la acción del evaluador.
//  Con Strategy cada algoritmo es una clase intercambiable, el
//  service no necesita if/else y se pueden agregar nuevos
//  criterios sin modificar código existente (Open/Closed).
//
//  Participantes:
//    - EvaluacionStrategy   → interfaz (clase base)
//    - AprobarStrategy      → Concrete Strategy
//    - RechazarStrategy     → Concrete Strategy
//    - EvaluacionContext    → Context que delega a la strategy
// ══════════════════════════════════════════════════════════════

// ─── Interfaz base (Strategy) ─────────────────────────────────
class EvaluacionStrategy {
  /**
   * Determina el estado que debe tener la solicitud.
   * @param {number} puntaje  0-100
   * @returns {'APROBADO'|'RECHAZADO'}
   */
  determinarEstado(puntaje) {
    throw new Error(`${this.constructor.name} debe implementar determinarEstado()`);
  }
}

// ─── Concrete Strategy: Aprobar ───────────────────────────────
// El evaluador decidió aprobar: solo se aprueba si supera el umbral.
class AprobarStrategy extends EvaluacionStrategy {
  constructor(umbral = 60) {
    super();
    this.umbral = umbral;
  }

  determinarEstado(puntaje) {
    return puntaje >= this.umbral ? 'APROBADO' : 'RECHAZADO';
  }
}

// ─── Concrete Strategy: Rechazar ──────────────────────────────
// El evaluador decidió rechazar explícitamente: siempre RECHAZADO.
class RechazarStrategy extends EvaluacionStrategy {
  determinarEstado(_puntaje) {
    return 'RECHAZADO';
  }
}

// ─── Context ──────────────────────────────────────────────────
class EvaluacionContext {
  constructor(strategy) {
    if (!(strategy instanceof EvaluacionStrategy)) {
      throw new Error('EvaluacionContext requiere una instancia de EvaluacionStrategy');
    }
    this._strategy = strategy;
  }

  setStrategy(strategy) {
    this._strategy = strategy;
  }

  ejecutar(puntaje) {
    return this._strategy.determinarEstado(puntaje);
  }
}

// ─── Factory de strategies (helper) ───────────────────────────
function crearStrategy(accion) {
  switch (accion) {
    case 'rechazar': return new RechazarStrategy();
    case 'aprobar':  return new AprobarStrategy(60);
    default:         throw new Error(`Acción desconocida: ${accion}`);
  }
}

module.exports = { EvaluacionStrategy, AprobarStrategy, RechazarStrategy, EvaluacionContext, crearStrategy };
