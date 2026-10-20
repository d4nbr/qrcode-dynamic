// Posicionamento do cartão do QR (QR + rede + senha) sobre a arte do wallpaper.
// Módulo puro, usado pelo servidor ao renderizar e pelo navegador na prévia,
// para que os dois encaixem o cartão exatamente do mesmo jeito.

export const OUTPUT_WIDTH = 1920
export const OUTPUT_HEIGHT = 1080

export const QR_SIZE_MIN = 240
export const QR_SIZE_MAX = 640

// Canto superior esquerdo do cartão e lado do QR, em px da imagem final.
export type QrPlacement = {
  qrLeft: number
  qrTop: number
  qrSize: number
}

// Onde o QR sempre esteve: a área branca da arte original da OAB.
// Registros sem posição gravada são tratados como nesta posição.
export const LEGACY_PLACEMENT: QrPlacement = { qrLeft: 816, qrTop: 264, qrSize: 331 }

// Layout do cartão com o QR no tamanho legado (escala 1). As coordenadas
// reproduzem as medidas da arte original, para que a posição legada continue
// gerando a mesma imagem. Em outros tamanhos, tudo é multiplicado pela escala.
export const CARD_LAYOUT = {
  qrSize: 331,
  padding: 21,
  width: 373,
  heightWithPassword: 505,
  heightOpen: 445,
  // Mesmo raio do painel branco da arte da OAB.
  radius: 20,
  centerX: 186,
  ssidDividerY: 368,
  ssidLabelY: 378,
  ssidValueY: 398,
  passwordDividerY: 432,
  passwordLabelY: 440,
  passwordValueY: 460,
} as const

export function cardScale(qrSize: number): number {
  return qrSize / CARD_LAYOUT.qrSize
}

export function cardSize(qrSize: number, hasPassword: boolean): { width: number; height: number } {
  const scale = cardScale(qrSize)
  const baseHeight = hasPassword ? CARD_LAYOUT.heightWithPassword : CARD_LAYOUT.heightOpen
  return { width: Math.round(CARD_LAYOUT.width * scale), height: Math.round(baseHeight * scale) }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// Maior QR cujo cartão ainda cabe na imagem a partir de (left, top).
export function maxQrSizeAt(left: number, top: number, hasPassword: boolean): number {
  let size = QR_SIZE_MAX
  while (size > QR_SIZE_MIN) {
    const { width, height } = cardSize(size, hasPassword)
    if (left + width <= OUTPUT_WIDTH && top + height <= OUTPUT_HEIGHT) break
    size--
  }
  return size
}

// Arredonda, limita o tamanho do QR e desloca o cartão para dentro da imagem.
export function fitPlacement(placement: QrPlacement, hasPassword: boolean): QrPlacement {
  const qrSize = clamp(Math.round(placement.qrSize), QR_SIZE_MIN, QR_SIZE_MAX)
  const { width, height } = cardSize(qrSize, hasPassword)
  return {
    qrLeft: clamp(Math.round(placement.qrLeft), 0, OUTPUT_WIDTH - width),
    qrTop: clamp(Math.round(placement.qrTop), 0, OUTPUT_HEIGHT - height),
    qrSize,
  }
}

type NullablePlacement = { qrLeft: number | null; qrTop: number | null; qrSize: number | null }

// Posição gravada num template ou wallpaper; sem os três valores, a legada.
export function storedPlacement(record: NullablePlacement): QrPlacement {
  const { qrLeft, qrTop, qrSize } = record
  if (qrLeft === null || qrTop === null || qrSize === null) return LEGACY_PLACEMENT
  return { qrLeft, qrTop, qrSize }
}

export function samePlacement(a: QrPlacement, b: QrPlacement): boolean {
  return a.qrLeft === b.qrLeft && a.qrTop === b.qrTop && a.qrSize === b.qrSize
}
