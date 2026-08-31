<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 15)->unique()->after('id');
            $table->string('firstname', 120)->after('username');
            $table->string('lastname', 120)->after('firstname');
            $table->enum('state', ['active', 'inactive'])->default('active')->after('password');
            $table->unsignedBigInteger('created_id')->nullable();
            $table->unsignedBigInteger('updated_id')->nullable();
            $table->unsignedBigInteger('deleted_id')->nullable();
            $table->unsignedBigInteger('restored_id')->nullable();
            $table->timestamp('restored_at')->nullable();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'username',
                'firstname',
                'lastname',
                'state',
                'created_id',
                'updated_id',
                'deleted_id',
                'restored_id',
                'restored_at',
                'deleted_at',
            ]);
        });
    }
};
