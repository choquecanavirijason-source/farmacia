<!doctype html>
<html>

<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        @page {
            /* 115px arriba deja espacio completo para el logo + nombre + fecha/sucursal sin pisar la tabla */
            margin: 115px 30px 55px 30px;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 9px;
            color: #222;
        }

        /* ENCABEZADO FIJO REPETIBLE EN TODAS LAS PÁGINAS */
        header {
            position: fixed;
            top: -95px;
            left: 0;
            right: 0;
            height: 85px;
            border-bottom: 1.5px solid #1a2e3b;
            padding-bottom: 4px;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
            border: none;
        }

        .header-table td {
            border: none;
            padding: 0;
            vertical-align: middle;
        }

        .logo-box {
            width: 30%;
            text-align: left;
        }

        .logo-img {
            max-height: 36px;
            max-width: 130px;
            vertical-align: middle;
        }

        .company-title-with-logo {
            display: inline-block;
            vertical-align: middle;
            font-size: 15px;
            font-weight: bold;
            color: #1a2e3b;
            margin-left: 6px;
            letter-spacing: -0.3px;
        }

        .logo-placeholder {
            font-size: 18px;
            font-weight: bold;
            color: #1a2e3b;
            letter-spacing: -0.5px;
        }

        .logo-placeholder span {
            color: #b82335;
        }

        /* TÍTULO CENTRADO */
        .title-box {
            width: 50%;
            text-align: center;
            padding-right: 15%;
            /* Contrapeso óptico para centrar respecto al ancho total */
        }

        .report-title {
            font-size: 20px;
            font-weight: bold;
            color: #111;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 10px;
            /* 👈 Sube o baja el título */
            margin-left: -180px;
            /* 👈 Desplaza horizontalmente */
        }

        /* Metadatos del Encabezado (Lugar/Fecha y Sucursal) */
        .meta-table {
            width: 100%;
            margin-top: 6px;
            border-collapse: collapse;
            border: none;
            font-size: 8.5px;
        }

        .meta-table td {
            border: none;
            padding: 1px 0;
        }

        .meta-label {
            font-weight: bold;
            color: #000;
        }

        /* Tabla principal de registros */
        table.data-table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 0;
        }

        table.data-table th,
        table.data-table td {
            border: 1px solid #777;
            padding: 4px 6px;
            text-align: left;
            word-wrap: break-word;
            overflow-wrap: break-word;
            vertical-align: middle;
        }

        table.data-table th {
            background-color: #eaeaea;
            font-weight: bold;
            color: #111;
            font-size: 8.5px;
            text-transform: uppercase;
        }

        table.data-table thead {
            display: table-header-group;
            /* Repite cabeceras de columnas */
        }

        table.data-table tr {
            page-break-inside: avoid;
            /* Evita partir filas */
        }

        table.data-table tr:nth-child(even) td {
            background-color: #fafafa;
        }
    </style>
</head>

<body>
    <!-- ENCABEZADO FIJO REPETIBLE -->
    <header>
        <table class="header-table">
            <tr>
                <td class="logo-box">
                    @if (!empty($company['logo_path']) && file_exists(public_path($company['logo_path'])))
                        <img src="{{ public_path($company['logo_path']) }}" class="logo-img" alt="Logo">
                        <span class="company-title-with-logo">{{ $company['name'] ?? 'Farmacia Juan de Dios' }}</span>
                    @else
                        <!-- Logo provisorio con estilo tipográfico similar al de la imagen -->
                        <div class="logo-placeholder">
                            <span>&#9634;</span> {{ $company['name'] ?? 'FARMACIA' }}
                        </div>
                    @endif
                </td>
                <td class="title-box">
                    <h1 class="report-title">{{ $title }}</h1>
                </td>
            </tr>
        </table>

        <table class="meta-table">
            <tr>
                <td style="width: 50%; text-align: left;">
                    <span class="meta-label">Lugar y fecha:</span>
                    <span>{{ $placeDate ?? 'Cochabamba, ' . \Carbon\Carbon::now('America/La_Paz')->locale('es')->translatedFormat('d \d\e F \d\e Y') }}</span>
                </td>
                <td style="width: 50%; text-align: right;">
                    <span class="meta-label">Sucursal:</span>
                    <span>{{ $agency ?? ($company['name'] ?? 'Casa Matriz') }}</span>
                </td>
            </tr>
        </table>
    </header>

    <!-- TABLA DE DATOS -->
    <table class="data-table">
        <thead>
            <tr>
                @foreach ($columns as $heading => $column)
                    <th>{{ $heading }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach ($records as $record)
                <tr>
                    @foreach ($columns as $column)
                        <td>{{ data_get($record, $column) }}</td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- PIE DE PÁGINA (ESTAMPADO DINÁMICO CON CANVAS DE DOMPDF) -->
    <script type="text/php">
        if (isset($pdf)) {
            $font = $fontMetrics->getFont("DejaVu Sans", "normal");
            $size = 7.5;
            $color = array(0.2, 0.2, 0.2);

            $userName = "{{ addslashes($user['name'] ?? (auth()->user()?->name ?? (auth()->user()?->firstname . ' ' . auth()->user()?->lastname ?? 'Sistema'))) }}";
            $printedAt = "{{ \Carbon\Carbon::now('America/La_Paz')->format('d-m-Y H:i:s') }}";

            // Coordenadas con mayor separación y holgura
            $leftX = 30;
            $y1 = $pdf->get_height() - 38;
            $y2 = $pdf->get_height() - 26;

            // Izquierda: Usuario y Fecha de Impresión
            $pdf->page_text($leftX, $y1, "Usuario: " . $userName, $font, $size, $color);
            $pdf->page_text($leftX, $y2, "Fecha y Hora de Impresión: " . $printedAt, $font, $size, $color);

            // Derecha: Página X de Y
            $pageText = "Página {PAGE_NUM} de {PAGE_COUNT}";
            $width = $fontMetrics->getTextWidth($pageText, $font, $size);
            $rightX = $pdf->get_width() - -70 - $width;
            $pdf->page_text($rightX, $y1, $pageText, $font, $size, $color);
        }
    </script>
</body>

</html>