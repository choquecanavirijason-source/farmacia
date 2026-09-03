<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branch_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medicament_id')->constrained('medicaments');
            $table->foreignId('from_branch_id')->constrained('branches');
            $table->foreignId('to_branch_id')->constrained('branches');
            $table->foreignId('source_batch_id')->constrained('batches');
            $table->foreignId('destination_batch_id')->constrained('batches');
            $table->integer('quantity');
            $table->string('reason')->nullable();
            $table->unsignedBigInteger('created_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_transfers');
    }
};
