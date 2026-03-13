# Analitica: Share objetivo y lectura de oportunidad

## Objetivo de esta seccion
Este documento ayuda a explicar, en lenguaje de negocio, como se interpreta el bloque de `Cobertura y oportunidad` del dashboard de Analitica.

Su foco principal es responder tres preguntas:

1. Que significa `Share objetivo por tienda`
2. De donde sale el `24.5%`
3. Cual es la diferencia entre `Detalle de oportunidad por tienda` y `Tiendas blancas priorizadas`

## Que significa Share objetivo por tienda
`Share objetivo por tienda` es una referencia interna de buen desempeno.

No representa el share total de Spring Air en todo el mercado. Tampoco es una meta comercial definida manualmente.

Lo que busca es responder esta idea:

`Si tomamos las tiendas donde Spring Air hoy compite mejor, cual es su nivel promedio de participacion?`

Ese promedio se usa despues como una referencia para medir cuanto espacio de crecimiento existe en otras tiendas.

## De donde sale el 24.5%
El `24.5%` sale del promedio simple del share actual de las 10 tiendas donde Spring Air hoy tiene mejor participacion.

La forma de construirlo es:

1. En cada tienda se toma la venta total del mercado.
2. En esa misma tienda se toma la venta de Spring Air.
3. Se calcula el share de Spring Air:
   `Venta Spring Air / Venta mercado`
4. Se ordenan las tiendas de mayor a menor share.
5. Se toman las primeras 10.
6. Se promedian esos 10 shares.

## Tiendas benchmark que construyen el 24.5%
Estas son las 10 tiendas que hoy forman el benchmark:

| Tienda | Mercado | Spring Air | Share actual |
|---|---:|---:|---:|
| Pachuca Plaza Q | $1,851,781 | $515,403 | 27.8328% |
| Paseo Durango | $1,133,085 | $313,475 | 27.6656% |
| Morelia Las Americas | $1,627,855 | $430,689 | 26.4575% |
| Forjadores | $203,735 | $53,634 | 26.3254% |
| Leon Plaza | $1,530,192 | $381,019 | 24.9001% |
| Queretaro Plaza | $1,308,818 | $324,307 | 24.7786% |
| Tangamanga | $1,391,467 | $344,767 | 24.7773% |
| Colima Zentralia | $810,930 | $172,051 | 21.2165% |
| Insurgentes | $669,979 | $137,913 | 20.5847% |
| Culiacan Galerias | $321,481 | $65,711 | 20.4400% |

## Como se llega al 24.5%
La suma de los shares de esas 10 tiendas es:

`27.8328% + 27.6656% + 26.4575% + 26.3254% + 24.9001% + 24.7786% + 24.7773% + 21.2165% + 20.5847% + 20.4400% = 244.9785%`

Ahora se divide entre 10:

`244.9785% / 10 = 24.4978%`

Ese resultado se redondea en el dashboard y se muestra como:

`24.5%`

## Como interpretar este valor
La lectura correcta es:

`En las tiendas donde Spring Air hoy compite mejor, su participacion promedio es de 24.5%.`

Por eso el dashboard usa ese numero como referencia para evaluar otras tiendas.

En otras palabras:

- Si una tienda esta muy por debajo de `24.5%`, hay brecha de crecimiento.
- Si una tienda esta cerca de `24.5%`, esta mas alineada con el benchmark interno.

## Que significa Gap
`Gap` es la distancia entre el share actual de una tienda y el share objetivo de `24.5%`.

La idea es simple:

`Gap = Share objetivo - Share actual`

Ejemplo con `Nezahualcoyotl`:

- Mercado: `$1,839,509`
- Spring Air: `$46,204`
- Share actual: `2.5%`
- Share objetivo: `24.5%`

Entonces:

`Gap = 24.5% - 2.5% = 22.0 puntos`

Ese `22.0%` no son pesos. Es la brecha de participacion que falta por capturar.

## Que significa Oportunidad
`Oportunidad` convierte el gap a pesos.

La pregunta que responde es:

`Cuanto venderia Spring Air adicionalmente en esa tienda si alcanzara el share objetivo?`

Ejemplo con `Nezahualcoyotl`:

- Mercado: `$1,839,509`
- Share objetivo: `24.5%`
- Venta esperada al objetivo: `aprox. $450,640`
- Venta actual Spring Air: `$46,204`

Entonces:

`Oportunidad = $450,640 - $46,204 = aprox. $404,436`

## Diferencia entre las dos tablas

### 1. Detalle de oportunidad por tienda
Esta tabla responde:

`Donde hay mas venta potencial por capturar?`

Ordena las tiendas por oportunidad en pesos.

Eso significa que aqui aparecen las tiendas donde el crecimiento potencial es mayor, aunque Spring Air ya tenga cierta presencia.

Por eso en esta tabla pueden aparecer casos como:

- `Internet`
- `Perisur`
- `Universidad`
- `Buenavista`

Estas tiendas no necesariamente son "blancas". Algunas ya tienen presencia de Spring Air, pero aun asi representan una gran bolsa de oportunidad por el tamano del mercado.

### 2. Tiendas blancas priorizadas
Esta tabla responde:

`En que tiendas casi no existe Spring Air, aunque el mercado si vale la pena?`

Para entrar aqui una tienda debe cumplir dos condiciones:

1. Tener un mercado relevante
2. Tener share de Spring Air menor a `3%`

Por eso esta tabla es mas selectiva. No busca solo oportunidad, sino baja presencia critica.

## Por que una tienda puede estar en una tabla y no en la otra

### Puede estar en `Detalle de oportunidad` y no en `Tiendas blancas`
Porque tiene mucho potencial economico, pero Spring Air ya tiene algo de presencia.

Ejemplos actuales:

- `Internet`: share `6.9%`
- `Perisur`: share `12.0%`
- `Oaxaca Plaza`: share `4.8%`
- `Universidad`: share `7.5%`
- `Buenavista`: share `5.2%`

Tienen oportunidad, pero no cumplen la condicion de ser tienda blanca.

### Puede estar en `Tiendas blancas` y no en el top de oportunidad`
Porque si cumple la regla de baja presencia, pero su oportunidad total no alcanza para entrar entre las 10 mas altas del ranking general.

Ejemplos actuales:

- `Tuxtla Gutierrez`
- `Coacalco Cosmopol`
- `Guadalajara Centro`
- `Coatzacoalcos`
- `Irapuato`

Estas tiendas casi no tienen presencia Spring Air y su mercado si es relevante, por eso se consideran focos de cobertura.

## Como leer ambas tablas en conjunto
La mejor forma de explicarlo a negocio es esta:

- `Detalle de oportunidad por tienda` sirve para priorizar crecimiento en pesos.
- `Tiendas blancas priorizadas` sirve para priorizar expansion o recuperacion de presencia.

Una tabla habla mas de `cuanto dinero falta capturar`.

La otra habla mas de `donde la marca casi no existe y deberia tener presencia`.

## Mensaje ejecutivo sugerido
Si se necesita explicar esto de forma corta en una reunion, se puede decir asi:

`El share objetivo por tienda de 24.5% se construye con el promedio de participacion de las 10 tiendas donde Spring Air hoy tiene mejor desempeno. Ese benchmark permite medir la brecha de otras tiendas. Con base en eso, el dashboard separa dos lecturas: las tiendas con mayor oportunidad economica y las tiendas blancas donde la marca casi no participa a pesar de existir mercado suficiente.`
