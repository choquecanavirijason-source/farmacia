<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_number');
            $table->date('expiration_date');
            $table->integer('current_quantity')->default(0);
            $table->decimal('purchase_price', 10, 2);
            $table->foreignId('medicament_id')->constrained('medicaments');
            $table->unsignedBigInteger('created_id')->nullable();
            $table->unsignedBigInteger('updated_id')->nullable();
            $table->unsignedBigInteger('deleted_id')->nullable();
            $table->unsignedBigInteger('restored_id')->nullable();
            $table->timestamp('restored_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batches');
    }
};
