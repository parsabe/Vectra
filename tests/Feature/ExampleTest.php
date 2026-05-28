<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    /**
     * Test that the presentation page is accessible.
     */
    public function test_the_presentation_page_returns_a_successful_response(): void
    {
        $response = $this->get('/presentation');

        $response->assertStatus(200);
        $response->assertSee('Vectra: The Quarantine Matrix');
    }
}
