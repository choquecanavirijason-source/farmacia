<?php

namespace App\Observers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AuditObserver
{
    public function creating(Model $model): void
    {
        if (Auth::check() && ! $model->created_id) {
            $model->created_id = Auth::id();
        }
    }

    public function updating(Model $model): void
    {
        if (Auth::check()) {
            $model->updated_id = Auth::id();
        }
    }

    public function deleting(Model $model): void
    {
        if (method_exists($model, 'isForceDeleting') && ! $model->isForceDeleting()) {
            if (Auth::check()) {
                $model->deleted_id = Auth::id();
            }
            $model->restored_id = null;
            $model->restored_at = null;
            $model->saveQuietly();
        }
    }

    public function restoring(Model $model): void
    {
        $model->deleted_id = null;
        if (Auth::check()) {
            $model->restored_id = Auth::id();
        }
        $model->restored_at = now();
    }
}
