<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; }
        h1 { font-size: 16px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #999; padding: 5px; text-align: left; }
        th { background: #eee; }
    </style>
</head>
<body>
    <h1>{{ $title }}</h1>
    <table>
        <thead><tr>@foreach ($columns as $heading => $column)<th>{{ $heading }}</th>@endforeach</tr></thead>
        <tbody>
        @foreach ($records as $record)
            <tr>@foreach ($columns as $column)<td>{{ data_get($record, $column) }}</td>@endforeach</tr>
        @endforeach
        </tbody>
    </table>
</body>
</html>
