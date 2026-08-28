<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClienteRequest;
use App\Http\Requests\UpdateClienteRequest;
use App\Http\Resources\ClienteResource;
use App\Models\Cliente;
use Dompdf\Dompdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ClienteController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search'));

        $clientes = Cliente::query()
            ->when($search !== '', fn (Builder $query) => $query->search($search))
            ->sort((string) $request->query('sort_by', 'nombre'), (string) $request->query('sort_dir', 'asc'))
            ->paginate(max(1, $request->integer('per_page', 10)));

        return ClienteResource::collection($clientes);
    }

    public function store(StoreClienteRequest $request)
    {
        return (new ClienteResource(Cliente::create($request->validated())))->response()->setStatusCode(201);
    }

    public function update(UpdateClienteRequest $request, Cliente $cliente)
    {
        $cliente->update($request->validated());

        return new ClienteResource($cliente);
    }

    public function exportar(Request $request)
    {
        $search = trim((string) $request->query('search'));

        $clientes = Cliente::query()
            ->when($search !== '', fn (Builder $query) => $query->search($search))
            ->sort((string) $request->query('sort_by', 'nombre'), (string) $request->query('sort_dir', 'asc'))
            ->get();

        return strtolower((string) $request->query('formato', 'excel')) === 'pdf'
            ? $this->exportarPdf($clientes)
            : $this->exportarExcel($clientes);
    }

    public function bulkDestroy(Request $request)
    {
        $ids = collect($request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct'],
        ])['ids'])
            ->map(fn ($id) => (int) $id)
            ->unique();

        $deleted = Cliente::query()
            ->whereIn('id_cliente', $ids)
            ->where('nombre', '!=', 'Consumidor Final')
            ->delete();

        return response()->json([
            'message' => "{$deleted} cliente(s) eliminado(s).",
            'deleted' => $deleted,
        ]);
    }

    public function destroy(Cliente $cliente)
    {
        if ($cliente->nombre === 'Consumidor Final') {
            return response()->json([
                'message' => 'No se puede eliminar el cliente genérico "Consumidor Final".',
            ], 409);
        }

        $cliente->delete();

        return response()->json(['message' => 'Cliente eliminado.']);
    }

    private function exportarExcel($clientes)
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Clientes');

        $sheet->fromArray(['CI/NIT', 'Nombre', 'Teléfono', 'Dirección'], null, 'A1');
        $sheet->getStyle('A1:D1')->getFont()->setBold(true);

        $row = 2;
        foreach ($clientes as $cliente) {
            $sheet->fromArray([
                $cliente->ci_nit,
                $cliente->nombre,
                $cliente->telefono,
                $cliente->direccion,
            ], null, "A{$row}");
            $row++;
        }

        foreach (range('A', 'D') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $temp = tempnam(sys_get_temp_dir(), 'clientes_');
        (new Xlsx($spreadsheet))->save($temp);

        return response()->download($temp, 'clientes.xlsx')->deleteFileAfterSend(true);
    }

    private function exportarPdf($clientes)
    {
        $html = view('exports.clientes_pdf', ['clientes' => $clientes])->render();

        $dompdf = new Dompdf();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="clientes.pdf"',
        ]);
    }
}
