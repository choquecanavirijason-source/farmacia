<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PaginationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'page'     => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:500',
            'search'   => 'nullable|string|max:255',
            'sort_by'  => 'nullable|string|max:100',
            'sort_dir' => 'nullable|string|in:asc,desc,ASC,DESC',
            'status'   => 'nullable|string|max:50',
        ];
    }

    public function getPerPage(int $default = 10): int
    {
        return max(1, $this->integer('per_page', $default));
    }

    public function getSortBy(string $default = 'id'): string
    {
        return (string) $this->query('sort_by', $default);
    }

    public function getSortDir(string $default = 'asc'): string
    {
        return strtolower((string) $this->query('sort_dir', $default));
    }

    public function getSearch(): string
    {
        return trim((string) $this->query('search', ''));
    }

    public function getFilters(array $keys = []): array
    {
        if (empty($keys)) {
            return $this->all();
        }

        return $this->only($keys);
    }
}
