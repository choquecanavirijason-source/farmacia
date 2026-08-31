<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medicaments', function (Blueprint $table) {
            $table->id();
            $table->string('code');
            $table->string('name');
            $table->string('concentration');
            $table->decimal('price', 10, 2);
            $table->integer('min_stock')->default(0);
            $table->boolean('requires_prescription')->default(false);
            $table->enum('status', ['active', 'inactive'])->default('active');

            $table->foreignId('laboratory_id')->constrained('laboratories');
            $table->foreignId('category_id')->constrained('categories');
            $table->foreignId('presentation_id')->constrained('presentations');
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
        Schema::dropIfExists('medicaments');
    }
};
