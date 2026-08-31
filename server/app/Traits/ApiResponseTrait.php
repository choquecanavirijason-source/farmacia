<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Pagination\AbstractPaginator;
use Symfony\Component\HttpFoundation\Response;

trait ApiResponseTrait
{
    public function successResponse(mixed $data = null, string $message = 'Operación realizada con éxito.', int $code = Response::HTTP_OK): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $code);
    }

    public function errorResponse(string $message = 'Ha ocurrido un error.', int $code = Response::HTTP_BAD_REQUEST, mixed $errors = null): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if (! is_null($errors)) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }

    public function collectionResponse(mixed $collection, string $message = 'Listado obtenido con éxito.', int $code = Response::HTTP_OK): JsonResponse
    {
        if ($collection instanceof ResourceCollection && $collection->resource instanceof AbstractPaginator) {
            $paginator = $collection->resource;
            $paginated = $collection->response()->getData(true);

            return response()->json([
                'success' => true,
                'message' => $message,
                'data'    => $paginated['data'],
                'meta'    => [
                    'current_page' => $paginator->currentPage(),
                    'from'         => $paginator->firstItem(),
                    'last_page'    => $paginator->lastPage(),
                    'per_page'     => $paginator->perPage(),
                    'to'           => $paginator->lastItem(),
                    'total'        => $paginator->total(),
                ],
            ], $code);
        }

        if ($collection instanceof AbstractPaginator) {
            return response()->json([
                'success' => true,
                'message' => $message,
                'data'    => $collection->items(),
                'meta'    => [
                    'current_page' => $collection->currentPage(),
                    'from'         => $collection->firstItem(),
                    'last_page'    => $collection->lastPage(),
                    'per_page'     => $collection->perPage(),
                    'to'           => $collection->lastItem(),
                    'total'        => $collection->total(),
                ],
            ], $code);
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $collection,
        ], $code);
    }

    public function paginatedResponse(mixed $collection, string $message = 'Listado obtenido con éxito.', int $code = Response::HTTP_OK): JsonResponse
    {
        return $this->collectionResponse($collection, $message, $code);
    }

    public function resourceResponse(mixed $resource, string $message = 'Registro obtenido con éxito.', int $code = Response::HTTP_OK): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $resource,
        ], $code);
    }

    public function createdResponse(mixed $data = null, string $message = 'Registro creado con éxito.'): JsonResponse
    {
        return $this->successResponse($data, $message, Response::HTTP_CREATED);
    }

    public function updatedResponse(mixed $data = null, string $message = 'Registro actualizado con éxito.'): JsonResponse
    {
        return $this->successResponse($data, $message, Response::HTTP_OK);
    }

    public function deletedResponse(string $message = 'Registro eliminado con éxito.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
        ], Response::HTTP_OK);
    }

    public function notFoundResponse(string $message = 'Recurso no encontrado.'): JsonResponse
    {
        return $this->errorResponse($message, Response::HTTP_NOT_FOUND);
    }

    public function validationErrorResponse(mixed $errors, string $message = 'Los datos proporcionados no son válidos.'): JsonResponse
    {
        return $this->errorResponse($message, Response::HTTP_UNPROCESSABLE_ENTITY, $errors);
    }

    public function unauthorizedResponse(string $message = 'No autenticado o credenciales inválidas.'): JsonResponse
    {
        return $this->errorResponse($message, Response::HTTP_UNAUTHORIZED);
    }

    public function forbiddenResponse(string $message = 'No tienes permisos para realizar esta acción.'): JsonResponse
    {
        return $this->errorResponse($message, Response::HTTP_FORBIDDEN);
    }
}
