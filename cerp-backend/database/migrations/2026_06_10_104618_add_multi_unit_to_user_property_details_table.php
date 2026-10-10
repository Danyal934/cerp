<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('user_property_details', function (Blueprint $table) {
            $table->tinyInteger('multi_unit')->default(0)->after('Store_front');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_property_details', function (Blueprint $table) {
            $table->dropColumn('multi_unit');
        });
    }
};
