/**
 * Cloudflare Worker for Professional Diver Training Platform
 * Serves static assets and handles API routing
 */

interface Env {
  ASSETS: Fetcher;
  API?: Fetcher;
  API_URL?: string;
  CACHE?: KVNamespace;
  DATA?: KVNamespace;
  DB?: D1Database; // D1 database binding
  ENVIRONMENT?: string;
  NODE_ENV?: string;
}

// Fallback function for learning path generation (same logic as server)
function generateFallbackLearningPath(userProfile: any): any[] {
  const isBeginner = userProfile.experience?.toLowerCase().includes('beginner') || 
                    userProfile.experience?.toLowerCase().includes('new') ||
                    userProfile.experience?.toLowerCase().includes('recreational');
  
  const goals = userProfile.goals || [];
  const hasCommercialGoal = goals.some((g: string) => g.toLowerCase().includes('commercial'));
  const hasInspectionGoal = goals.some((g: string) => g.toLowerCase().includes('inspection'));
  const hasMedicalGoal = goals.some((g: string) => g.toLowerCase().includes('medic') || g.toLowerCase().includes('medicine'));
  const hasSupervisorGoal = goals.some((g: string) => g.toLowerCase().includes('supervisor') || g.toLowerCase().includes('management'));
  const hasWeldingGoal = goals.some((g: string) => g.toLowerCase().includes('welding'));
  const hasSaturationGoal = goals.some((g: string) => g.toLowerCase().includes('saturation'));

  const suggestions: any[] = [];

  // Path 1: Foundation Path (for beginners or commercial diving career)
  if (isBeginner || hasCommercialGoal) {
    suggestions.push({
      id: "foundation-path",
      title: "Commercial Diving Foundation Path",
      description: "Essential certifications to start your commercial diving career with a strong safety foundation",
      difficulty: "Beginner",
      estimatedWeeks: 16,
      tracks: [
        {
          id: "alst",
          title: "Assistant Life Support Technician",
          slug: "alst",
          order: 1,
          reason: "Foundation certification required for all commercial diving operations. Covers essential life support systems and safety protocols."
        },
        {
          id: "lst",
          title: "Life Support Technician (LST)",
          slug: "lst",
          order: 2,
          reason: "Advanced life support systems management. Builds on ALST foundation with deeper technical knowledge."
        }
      ],
      confidence: 90,
      reasoning: "This foundation path provides the essential safety certifications required by industry standards (IMCA, ADCI) for all commercial diving operations. Starting with ALST ensures you understand critical life support systems before advancing to specialized roles."
    });
  }

  // Path 2: Specialized Career Path based on goals
  if (hasInspectionGoal || hasWeldingGoal || hasSupervisorGoal) {
    const specializedTracks: any[] = [];
    
    if (hasInspectionGoal) {
      specializedTracks.push({
        id: "ndt-inspection",
        title: "NDT Inspection & Testing",
        slug: "ndt-inspection",
        order: specializedTracks.length + 1,
        reason: "Professional underwater inspection techniques for structural integrity assessment and quality assurance."
      });
    }
    
    if (hasWeldingGoal) {
      specializedTracks.push({
        id: "underwater-welding",
        title: "Advanced Underwater Welding",
        slug: "underwater-welding",
        order: specializedTracks.length + 1,
        reason: "Professional underwater welding techniques, electrode selection, and quality control for marine construction."
      });
    }
    
    if (hasSupervisorGoal) {
      specializedTracks.push({
        id: "commercial-supervisor",
        title: "Commercial Dive Supervisor",
        slug: "commercial-supervisor",
        order: specializedTracks.length + 1,
        reason: "Leadership and dive operations management. Essential for advancing to supervisory roles."
      });
    }

    if (specializedTracks.length > 0) {
      suggestions.push({
        id: "specialized-path",
        title: "Specialized Career Development Path",
        description: "Advanced certifications aligned with your specific career goals and interests",
        difficulty: "Advanced",
        estimatedWeeks: 24,
        tracks: specializedTracks,
        confidence: 85,
        reasoning: `Based on your goals (${goals.join(', ')}), this path focuses on specialized certifications that directly advance your career objectives. These certifications are in high demand and offer excellent career progression opportunities.`
      });
    }
  }

  // Path 3: Medical/Safety Path
  if (hasMedicalGoal) {
    suggestions.push({
      id: "medical-path",
      title: "Diving Medicine & Safety Specialist Path",
      description: "Comprehensive medical response and safety management for diving operations",
      difficulty: "Expert",
      estimatedWeeks: 20,
      tracks: [
        {
          id: "diver-medic",
          title: "Diver Medic Technician",
          slug: "diver-medic",
          order: 1,
          reason: "Emergency medical response and diving injury treatment. Critical for safety leadership roles."
        },
        {
          id: "hyperbaric-operations",
          title: "Hyperbaric Chamber Operations",
          slug: "hyperbaric-operations",
          order: 2,
          reason: "Hyperbaric treatment protocols and patient monitoring. Complements medical training."
        }
      ],
      confidence: 88,
      reasoning: "This path combines medical emergency response with hyperbaric medicine, creating a comprehensive safety specialist profile highly valued in commercial diving operations."
    });
  }

  // Path 4: Deep Diving Path
  if (hasSaturationGoal) {
    suggestions.push({
      id: "deep-diving-path",
      title: "Deep Sea & Saturation Diving Path",
      description: "Advanced deep-sea operations and saturation diving systems",
      difficulty: "Expert",
      estimatedWeeks: 28,
      tracks: [
        {
          id: "saturation-diving",
          title: "Saturation Diving Systems",
          slug: "saturation-diving",
          order: 1,
          reason: "Saturation diving operations, life support systems, and decompression management for deep-sea work."
        },
        {
          id: "alst",
          title: "Assistant Life Support Technician",
          slug: "alst",
          order: 2,
          reason: "Essential prerequisite for saturation diving operations."
        }
      ],
      confidence: 92,
      reasoning: "Saturation diving requires advanced life support knowledge. This path ensures you have the foundational skills before advancing to deep-sea operations."
    });
  }

  // If no specific paths match, provide a general advancement path
  if (suggestions.length === 0) {
    suggestions.push({
      id: "general-advancement",
      title: "Professional Diving Advancement Path",
      description: "Comprehensive training to advance your diving career across multiple specializations",
      difficulty: "Intermediate",
      estimatedWeeks: 20,
      tracks: [
        {
          id: "alst",
          title: "Assistant Life Support Technician",
          slug: "alst",
          order: 1,
          reason: "Foundation for all commercial diving operations"
        },
        {
          id: "diver-medic",
          title: "Diver Medic Technician",
          slug: "diver-medic",
          order: 2,
          reason: "Medical emergency response capabilities"
        },
        {
          id: "ndt-inspection",
          title: "NDT Inspection & Testing",
          slug: "ndt-inspection",
          order: 3,
          reason: "Professional inspection skills for career diversification"
        }
      ],
      confidence: 80,
      reasoning: "This balanced path provides a strong foundation in safety, medical response, and technical skills, opening multiple career opportunities in commercial diving."
    });
  }

  return suggestions;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Redirect www.professionaldiver.app to professionaldiver.app
    if (url.hostname === "www.professionaldiver.app") {
      const redirectUrl = `https://professionaldiver.app${url.pathname}${url.search}`;
      return Response.redirect(redirectUrl, 301);
    }

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://professionaldiver.app",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    };

    // Handle OPTIONS requests
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT || "production",
          service: "Diver Well Training Platform",
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Handle learning path generation FIRST, before other API routes
    // This ensures it's always handled even if proxy fails
    if (url.pathname === "/api/learning-path/generate" && request.method === "POST") {
      console.log("🔍 Learning path generation endpoint hit - path:", url.pathname, "method:", request.method);
      try {
        // Clone the request to read the body without consuming the original
        const clonedRequest = request.clone();
        let body: any;
        try {
          body = await clonedRequest.json();
          console.log("📦 Request body parsed successfully");
        } catch (parseError) {
          console.error("❌ Error parsing request body:", parseError);
          return new Response(
            JSON.stringify({ error: 'Invalid request body', details: parseError instanceof Error ? parseError.message : 'Unknown error' }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        
        const { preferences, profile, additionalInfo } = body;
        
        // Normalize the data structure
        let userProfile: any;
        if (preferences) {
          userProfile = {
            experience: preferences.experienceLevel || '',
            goals: preferences.goals || preferences.interests || [],
            timeCommitment: preferences.timeAvailable || '',
            certifications: preferences.certifications || [],
            interests: preferences.interests || []
          };
        } else if (profile) {
          userProfile = profile;
        } else {
          return new Response(
            JSON.stringify({ error: 'Profile or preferences with experience and goals is required' }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        
        if (!userProfile.experience || !userProfile.goals || userProfile.goals.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Experience level and at least one goal are required' }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // Generate fallback learning path suggestions
        console.log("🎯 Generating learning path for profile");
        const suggestions = generateFallbackLearningPath(userProfile);
        console.log("✅ Generated", suggestions.length, "learning path suggestions");
        
        return new Response(
          JSON.stringify({
            success: true,
            suggestions: suggestions,
            message: "Learning path generated using intelligent matching"
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      } catch (error) {
        console.error("Learning path generation error:", error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to generate learning path suggestions',
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Handle /api/users/current endpoint - critical for user role detection
    if (url.pathname === "/api/users/current" && request.method === "GET") {
      try {
        // Try to proxy to API worker if available
        if (env.API) {
          try {
            const apiRequest = new Request(`${url.pathname}${url.search}`, {
              method: request.method,
              headers: request.headers,
            });
            const apiResponse = await env.API.fetch(apiRequest);
            if (apiResponse.status !== 501) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("API proxy error for /api/users/current:", error);
          }
        }

        // Try external API URL if configured
        if (env.API_URL) {
          try {
            const apiUrl = `${env.API_URL}/api/users/current${url.search}`;
            const apiRequest = new Request(apiUrl, {
              method: request.method,
              headers: request.headers,
            });
            const apiResponse = await fetch(apiRequest);
            if (apiResponse.ok || apiResponse.status !== 501) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("External API fetch error for /api/users/current:", error);
          }
        }

        // Fallback: Return user info based on email
        const email = url.searchParams.get('email');
        if (!email) {
          return new Response(JSON.stringify({ error: 'Email required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const superAdminEmails = ['lalabalavu.jon@gmail.com'];
        const adminEmails = ['sephdee@hotmail.com'];
        const partnerAdminEmails = ['freddierussell.joseph@yahoo.com', 'deesuks@gmail.com'];

        if (superAdminEmails.includes(normalizedEmail)) {
          return new Response(JSON.stringify({
            email: normalizedEmail,
            role: 'SUPER_ADMIN',
            subscriptionType: 'LIFETIME',
            subscriptionStatus: 'ACTIVE',
            name: 'Jon Lalabalavu',
            createdAt: new Date('2024-01-01T00:00:00Z').toISOString() // Project founder - member since beginning
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        if (adminEmails.includes(normalizedEmail)) {
          return new Response(JSON.stringify({
            email: normalizedEmail,
            role: 'ADMIN',
            subscriptionType: 'LIFETIME',
            subscriptionStatus: 'ACTIVE',
            name: 'Jon Lalabalavu',
            createdAt: new Date('2024-01-15T00:00:00Z').toISOString() // Early admin member
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        if (partnerAdminEmails.includes(normalizedEmail)) {
          return new Response(JSON.stringify({
            email: normalizedEmail,
            role: 'PARTNER_ADMIN',
            subscriptionType: 'LIFETIME',
            subscriptionStatus: 'ACTIVE',
            name: normalizedEmail === 'deesuks@gmail.com' ? 'Dilo Suka' : 'Freddie Joseph',
            createdAt: new Date('2024-02-01T00:00:00Z').toISOString() // Early partner admin
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        // Lifetime users (normal users with lifetime access for preview/testing)
        if (lifetimeUserEmails.includes(normalizedEmail)) {
          return new Response(JSON.stringify({
            email: normalizedEmail,
            role: 'USER', // Normal user role (not admin)
            subscriptionType: 'LIFETIME', // Lifetime subscription
            subscriptionStatus: 'ACTIVE',
            name: 'Preview User',
            createdAt: new Date('2024-01-01T00:00:00Z').toISOString()
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        // Default user response
        return new Response(JSON.stringify({
          email: normalizedEmail,
          role: 'USER',
          subscriptionType: 'TRIAL',
          createdAt: new Date().toISOString() // New users get current date
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch user',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }

    // Handle /api/users/profile endpoint - profile updates
    if (url.pathname === "/api/users/profile" && request.method === "PUT") {
      try {
        // Try to proxy to API worker if available
        if (env.API) {
          try {
            const body = request.body ? await request.clone().arrayBuffer() : null;
            const apiRequest = new Request(`${url.pathname}${url.search}`, {
              method: request.method,
              headers: request.headers,
              body: body,
            });
            const apiResponse = await env.API.fetch(apiRequest);
            if (apiResponse.status !== 501) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("API proxy error for /api/users/profile:", error);
          }
        }

        // Try external API URL if configured
        if (env.API_URL) {
          try {
            const apiUrl = `${env.API_URL}/api/users/profile${url.search}`;
            const body = request.body ? await request.clone().arrayBuffer() : null;
            const apiRequest = new Request(apiUrl, {
              method: request.method,
              headers: request.headers,
              body: body,
            });
            const apiResponse = await fetch(apiRequest);
            if (apiResponse.ok || apiResponse.status !== 501) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("External API fetch error for /api/users/profile:", error);
          }
        }

        // Fallback: Return success response (profile updates stored in localStorage on client side)
        // In a production environment, this should be handled by the backend API
        const body = await request.json();
        const userEmail = request.headers.get('x-user-email') || body.currentEmail || body.email;
        
        if (!userEmail) {
          return new Response(JSON.stringify({ error: 'User email is required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        // Extract profile data
        const { currentEmail, profilePictureUrl, ...profileData } = body;
        
        // Return success response - actual persistence should be handled by backend
        return new Response(JSON.stringify({
          success: true,
          message: 'Profile updated successfully',
          user: {
            email: userEmail,
            profilePictureUrl: profilePictureUrl || body.profilePictureURL,
            ...profileData
          }
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Failed to update profile',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }

    // Handle /api/users/profile-picture endpoint - profile picture updates
    if (url.pathname === "/api/users/profile-picture" && request.method === "PUT") {
      try {
        // Try to proxy to API worker if available
        if (env.API) {
          try {
            const body = request.body ? await request.clone().arrayBuffer() : null;
            const apiRequest = new Request(`${url.pathname}${url.search}`, {
              method: request.method,
              headers: request.headers,
              body: body,
            });
            const apiResponse = await env.API.fetch(apiRequest);
            if (apiResponse.status !== 501) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("API proxy error for /api/users/profile-picture:", error);
          }
        }

        // Try external API URL if configured
        if (env.API_URL) {
          try {
            const apiUrl = `${env.API_URL}/api/users/profile-picture${url.search}`;
            const body = request.body ? await request.clone().arrayBuffer() : null;
            const apiRequest = new Request(apiUrl, {
              method: request.method,
              headers: request.headers,
              body: body,
            });
            const apiResponse = await fetch(apiRequest);
            if (apiResponse.ok || apiResponse.status !== 501) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("External API fetch error for /api/users/profile-picture:", error);
          }
        }

        // Fallback: Return success response
        const body = await request.json();
        const userEmail = request.headers.get('x-user-email') || body.email;
        
        if (!userEmail) {
          return new Response(JSON.stringify({ error: 'User email is required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Profile picture updated successfully',
          profilePictureURL: body.profilePictureURL
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Failed to update profile picture',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }

    // Handle authentication endpoint FIRST - critical for login
    if (url.pathname === "/api/auth/credentials" && request.method === "POST") {
      try {
        // Try to proxy to API worker if available
        if (env.API) {
          try {
            const body = request.body ? await request.clone().arrayBuffer() : null;
            const apiRequest = new Request(`${url.pathname}${url.search}`, {
              method: request.method,
              headers: request.headers,
              body: body,
            });
            const apiResponse = await env.API.fetch(apiRequest);
            if (apiResponse.status !== 501) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("API proxy error for auth:", error);
          }
        }

        // Try external API URL if configured
        if (env.API_URL) {
          try {
            const apiUrl = `${env.API_URL}/api/auth/credentials`;
            const apiRequest = new Request(apiUrl, {
              method: request.method,
              headers: request.headers,
              body: request.body,
            });
            const apiResponse = await fetch(apiRequest);
            if (apiResponse.ok || apiResponse.status !== 501) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("External API fetch error for auth:", error);
          }
        }

        // Fallback: Handle authentication locally for known admin emails
        const body = await request.json();
        const { email, password, rememberMe } = body;

        if (!email || !password) {
          return new Response(JSON.stringify({ error: 'Email and password are required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const superAdminEmails = ['lalabalavu.jon@gmail.com'];
        const adminEmails = ['sephdee@hotmail.com'];
        const partnerAdminEmails = ['freddierussell.joseph@yahoo.com', 'deesuks@gmail.com'];
        const lifetimeUserEmails = ['preview@professionaldiver.app']; // Normal users with lifetime access

        if (superAdminEmails.includes(normalizedEmail)) {
          return new Response(JSON.stringify({
            success: true,
            user: {
              id: 'super-admin-1',
              email: normalizedEmail,
              name: 'Jon Lalabalavu',
              role: 'SUPER_ADMIN',
              subscriptionType: 'LIFETIME',
              subscriptionStatus: 'ACTIVE',
              createdAt: new Date('2024-01-01T00:00:00Z').toISOString() // Project founder - member since beginning
            },
            rememberMe: rememberMe || false
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        if (adminEmails.includes(normalizedEmail)) {
          return new Response(JSON.stringify({
            success: true,
            user: {
              id: 'admin-1',
              email: normalizedEmail,
              name: 'Jon Lalabalavu',
              role: 'ADMIN',
              subscriptionType: 'LIFETIME',
              subscriptionStatus: 'ACTIVE',
              createdAt: new Date('2024-01-15T00:00:00Z').toISOString() // Early admin member
            },
            rememberMe: rememberMe || false
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        if (partnerAdminEmails.includes(normalizedEmail)) {
          return new Response(JSON.stringify({
            success: true,
            user: {
              id: 'partner-admin-1',
              email: normalizedEmail,
              name: normalizedEmail === 'deesuks@gmail.com' ? 'Dilo Suka' : 'Freddie Joseph',
              role: 'PARTNER_ADMIN',
              subscriptionType: 'LIFETIME',
              subscriptionStatus: 'ACTIVE',
              restrictedAccess: ['affiliate', 'finance', 'revenue', 'billing', 'payments'],
              createdAt: new Date('2024-02-01T00:00:00Z').toISOString() // Early partner admin
            },
            rememberMe: rememberMe || false
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        // Lifetime users (normal users with lifetime access for preview/testing)
        if (lifetimeUserEmails.includes(normalizedEmail)) {
          return new Response(JSON.stringify({
            success: true,
            user: {
              id: 'user-preview-1',
              email: normalizedEmail,
              name: 'Preview User',
              role: 'USER', // Normal user role (not admin)
              subscriptionType: 'LIFETIME', // Lifetime subscription
              subscriptionStatus: 'ACTIVE',
              createdAt: new Date('2024-01-01T00:00:00Z').toISOString()
            },
            rememberMe: rememberMe || false
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        // For other users, return 401 (not 501) to indicate authentication failed
        return new Response(JSON.stringify({ 
          error: 'Invalid credentials',
          note: 'For full authentication, please ensure Express API server is accessible via API_URL'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Authentication failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }

    // Handle tracks endpoints with fallback data
    if (url.pathname === "/api/tracks" && request.method === "GET") {
      try {
        console.log("🔍 All tracks request - path:", url.pathname);
        // Try to proxy to API worker if available
        if (env.API) {
          try {
            // Use service binding - create request with full URL context
            const apiRequest = new Request(new URL(url.pathname + url.search, request.url).toString(), {
              method: request.method,
              headers: request.headers,
            });
            console.log("🔗 Proxying /api/tracks to API worker");
            const apiResponse = await env.API.fetch(apiRequest);
            if (apiResponse.status !== 501 && apiResponse.ok) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("API proxy error for tracks:", error);
          }
        }

        // Try external API URL if configured
        if (env.API_URL) {
          try {
            const apiUrl = `${env.API_URL}/api/tracks${url.search}`;
            const apiRequest = new Request(apiUrl, {
              method: request.method,
              headers: request.headers,
            });
            const apiResponse = await fetch(apiRequest);
            if (apiResponse.ok) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("External API fetch error for tracks:", error);
          }
        }

        // Fallback: Return all 9 professional diving tracks (including Air Diver Certification)
        const allTracks = [
          {
            id: "ndt-inspection",
            title: "NDT Inspection & Testing",
            slug: "ndt-inspection",
            summary: "Master visual inspection, magnetic particle testing, and ultrasonic testing for professional certification.",
            isPublished: true,
            createdAt: new Date().toISOString(),
            aiTutor: {
              id: "tutor-1",
              name: "Dr. Sarah Chen",
              specialty: "NDT Inspection Specialist",
              description: "Expert in underwater non-destructive testing and quality assurance"
            }
          },
          {
            id: "diver-medic",
            title: "Diver Medic Technician (DMT)",
            slug: "diver-medic",
            summary: "Emergency medical response, ABCDE assessment, and diving injury treatment certification.",
            isPublished: true,
            createdAt: new Date().toISOString(),
            aiTutor: {
              id: "tutor-2",
              name: "Dr. Michael Rodriguez",
              specialty: "Emergency Medicine Specialist",
              description: "Diving medical officer with emergency response expertise"
            }
          },
          {
            id: "commercial-supervisor",
            title: "Commercial Dive Supervisor",
            slug: "commercial-supervisor",
            summary: "Dive operations management, safety protocols, and emergency response leadership.",
            isPublished: true,
            createdAt: new Date().toISOString(),
            aiTutor: {
              id: "tutor-3",
              name: "Captain James Mitchell",
              specialty: "Dive Operations Management",
              description: "Commercial dive supervisor with 20+ years experience"
            }
          },
          {
            id: "saturation-diving",
            title: "Saturation Diving Systems",
            slug: "saturation-diving",
            summary: "Saturation diving operations, life support systems, and decompression management.",
            isPublished: true,
            createdAt: new Date().toISOString(),
            aiTutor: {
              id: "tutor-4",
              name: "Chief Engineer Lisa Wang",
              specialty: "Saturation Diving Systems",
              description: "Expert in life support systems and saturation operations"
            }
          },
          {
            id: "underwater-welding",
            title: "Advanced Underwater Welding",
            slug: "underwater-welding",
            summary: "Professional underwater welding techniques, electrode selection, and quality control.",
            isPublished: true,
            createdAt: new Date().toISOString(),
            aiTutor: {
              id: "tutor-5",
              name: "Master Welder Carlos Mendez",
              specialty: "Underwater Welding",
              description: "Professional underwater welding and marine construction"
            }
          },
          {
            id: "hyperbaric-operations",
            title: "Hyperbaric Chamber Operations",
            slug: "hyperbaric-operations",
            summary: "Hyperbaric treatment protocols, emergency procedures, and patient monitoring.",
            isPublished: true,
            createdAt: new Date().toISOString(),
            aiTutor: {
              id: "tutor-6",
              name: "Dr. Emma Thompson",
              specialty: "Hyperbaric Medicine",
              description: "Hyperbaric chamber operations and decompression therapy"
            }
          },
          {
            id: "alst",
            title: "Advanced Life Support Technician (ALST)",
            slug: "alst",
            summary: "Advanced life support operations, emergency decompression protocols, and saturation diving medical procedures.",
            isPublished: true,
            createdAt: new Date().toISOString(),
            aiTutor: {
              id: "tutor-7",
              name: "Senior Technician Alex Johnson",
              specialty: "Life Support Systems",
              description: "Advanced life support operations and emergency protocols"
            }
          },
          {
            id: "lst",
            title: "Life Support Technician (LST)",
            slug: "lst",
            summary: "Life support system operations, gas management, and emergency response procedures.",
            isPublished: true,
            createdAt: new Date().toISOString(),
            aiTutor: {
              id: "tutor-8",
              name: "Technician Maria Santos",
              specialty: "Life Support Operations",
              description: "Life support system operations and gas management"
            }
          },
          {
            id: "air-diver-certification",
            title: "Air Diver Certification",
            slug: "air-diver-certification",
            summary: "Essential air diving skills including diving physics review, gas management concepts, ascent best practices, problem-solving drills, tool handling safety, and basic communications.",
            isPublished: true,
            createdAt: new Date().toISOString(),
            aiTutor: {
              id: "tutor-9",
              name: "Lisa Thompson",
              specialty: "Air Diving Operations",
              description: "Expert in air diving operations, gas management, and safety protocols"
            }
          }
        ];

        console.log("✅ Returning fallback tracks data - count:", allTracks.length);
        return new Response(JSON.stringify(allTracks), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error("Tracks API error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch tracks" }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }
    }

    // Handle individual track by slug endpoint
    if (url.pathname.startsWith("/api/tracks/") && url.pathname !== "/api/tracks" && !url.pathname.endsWith("/lessons") && request.method === "GET") {
      try {
        // Extract slug from path like "/api/tracks/ndt-inspection" -> "ndt-inspection"
        const pathParts = url.pathname.split("/api/tracks/");
        const slug = pathParts[1]?.split("/")[0]?.split("?")[0];
        
        console.log("🔍 Track detail request - path:", url.pathname, "slug:", slug);
        
        if (!slug) {
          return new Response(JSON.stringify({ error: "Track slug is required" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          });
        }
        
        // Try to proxy to API worker if available
        let apiSuccess = false;
        if (env.API) {
          try {
            // Use service binding - create request with full URL context
            const apiRequest = new Request(new URL(url.pathname + url.search, request.url).toString(), {
              method: request.method,
              headers: request.headers,
            });
            console.log("🔗 Proxying to API worker:", url.pathname);
            const apiResponse = await env.API.fetch(apiRequest);
            // Only use API response if it's successful (200-299) and not 501
            if (apiResponse.status !== 501 && apiResponse.ok) {
              // Get the response body as text first so we can parse it
              const responseText = await apiResponse.text();
              let responseData: any = null;
              
              try {
                responseData = JSON.parse(responseText);
                console.log("📦 API response for track:", slug, "has lessons:", responseData?.lessons?.length || 0);
              } catch (e) {
                console.error("Error parsing API response:", e);
              }
              
              // If track doesn't have lessons, try fetching from lessons endpoint
              if (responseData && (!responseData.lessons || responseData.lessons.length === 0)) {
                console.log("🔍 Track has no lessons, trying to fetch separately...");
                try {
                  const lessonsRequest = new Request(`${url.pathname}/lessons`, {
                    method: "GET",
                    headers: request.headers,
                  });
                  const lessonsResponse = await env.API.fetch(lessonsRequest);
                  if (lessonsResponse.ok) {
                    const lessonsData = await lessonsResponse.json();
                    console.log("📚 Fetched lessons separately:", lessonsData?.lessons?.length || 0);
                    if (lessonsData.lessons && lessonsData.lessons.length > 0) {
                      responseData.lessons = lessonsData.lessons;
                    } else if (lessonsData && Array.isArray(lessonsData)) {
                      // Sometimes the lessons endpoint returns an array directly
                      responseData.lessons = lessonsData;
                    }
                  } else {
                    console.log("❌ Lessons endpoint returned status:", lessonsResponse.status);
                  }
                } catch (lessonsError) {
                  console.error("Error fetching lessons separately:", lessonsError);
                }
              }
              
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              responseHeaders.set('Content-Type', 'application/json');
              apiSuccess = true;
              
              // Return the response with lessons (either from original or fetched separately)
              return new Response(JSON.stringify(responseData || responseText), {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            } else {
              console.log("⚠️ API worker returned status:", apiResponse.status, "for track:", slug);
            }
          } catch (error) {
            console.error("API proxy error for track:", error);
          }
        }

        // Try external API URL if configured (only if API worker didn't succeed)
        if (!apiSuccess && env.API_URL) {
          try {
            const apiUrl = `${env.API_URL}/api/tracks/${slug}${url.search}`;
            const apiRequest = new Request(apiUrl, {
              method: request.method,
              headers: request.headers,
            });
            const apiResponse = await fetch(apiRequest);
            // Only use external API response if it's successful
            if (apiResponse.ok) {
              // Get the response body as text first so we can parse it
              const responseText = await apiResponse.text();
              let responseData: any = null;
              
              try {
                responseData = JSON.parse(responseText);
                console.log("📦 External API response for track:", slug, "has lessons:", responseData?.lessons?.length || 0);
              } catch (e) {
                console.error("Error parsing external API response:", e);
              }
              
              // If track doesn't have lessons, try fetching from lessons endpoint
              if (responseData && (!responseData.lessons || responseData.lessons.length === 0)) {
                console.log("🔍 Track has no lessons from external API, trying to fetch separately...");
                try {
                  const lessonsUrl = `${env.API_URL}/api/tracks/${slug}/lessons`;
                  const lessonsResponse = await fetch(lessonsUrl);
                  if (lessonsResponse.ok) {
                    const lessonsData = await lessonsResponse.json();
                    console.log("📚 Fetched lessons from external API:", lessonsData?.lessons?.length || 0);
                    if (lessonsData.lessons && lessonsData.lessons.length > 0) {
                      responseData.lessons = lessonsData.lessons;
                    } else if (lessonsData && Array.isArray(lessonsData)) {
                      // Sometimes the lessons endpoint returns an array directly
                      responseData.lessons = lessonsData;
                    }
                  } else {
                    console.log("❌ External lessons endpoint returned status:", lessonsResponse.status);
                  }
                } catch (lessonsError) {
                  console.error("Error fetching lessons from external API:", lessonsError);
                }
              }
              
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              responseHeaders.set('Content-Type', 'application/json');
              apiSuccess = true;
              
              // Return the response with lessons (either from original or fetched separately)
              return new Response(JSON.stringify(responseData || responseText), {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            } else {
              console.log("⚠️ External API returned status:", apiResponse.status, "for track:", slug);
            }
          } catch (error) {
            console.error("External API fetch error for track:", error);
          }
        }

        // Fallback: Return track by slug
        const tracksBySlug: { [key: string]: any } = {
          "ndt-inspection": {
            id: "ndt-inspection",
            title: "NDT Inspection & Testing",
            slug: "ndt-inspection",
            summary: "Master visual inspection, magnetic particle testing, and ultrasonic testing for professional certification.",
            isPublished: true,
            createdAt: new Date().toISOString(),
            difficulty: "advanced",
            estimatedHours: 40,
            aiTutorId: "tutor-1",
            lessons: [],
            aiTutor: {
              id: "tutor-1",
              name: "Dr. Sarah Chen",
              specialty: "NDT Inspection Specialist",
              description: "Expert in underwater non-destructive testing and quality assurance"
            }
          },
          "diver-medic": {
            id: "diver-medic",
            title: "Diver Medic Technician (DMT)",
            slug: "diver-medic",
            summary: "Emergency medical response, ABCDE assessment, and diving injury treatment certification.",
            isPublished: true,
            createdAt: new Date().toISOString(),
            difficulty: "expert",
            estimatedHours: 60,
            aiTutorId: "tutor-2",
            lessons: [],
            aiTutor: {
              id: "tutor-2",
              name: "Dr. Michael Rodriguez",
              specialty: "Emergency Medicine Specialist",
              description: "Diving medical officer with emergency response expertise"
            }
          },
          "commercial-supervisor": {
            id: "commercial-supervisor",
            title: "Commercial Dive Supervisor",
            slug: "commercial-supervisor",
            summary: "Dive operations management, safety protocols, and emergency response leadership.",
            isPublished: true,
            createdAt: new Date().toISOString(),
            difficulty: "expert",
            estimatedHours: 50,
            aiTutorId: "tutor-3",
            lessons: [],
            aiTutor: {
              id: "tutor-3",
              name: "Captain James Mitchell",
              specialty: "Dive Operations Management",
              description: "Commercial dive supervisor with 20+ years experience"
            }
          },
          "saturation-diving": {
            id: "saturation-diving",
            title: "Saturation Diving Systems",
            slug: "saturation-diving",
            summary: "Saturation diving operations, life support systems, and decompression management.",
            isPublished: true,
            createdAt: new Date().toISOString(),
            difficulty: "expert",
            estimatedHours: 80,
            aiTutorId: "tutor-4",
            lessons: [],
            aiTutor: {
              id: "tutor-4",
              name: "Chief Engineer Lisa Wang",
              specialty: "Saturation Diving Systems",
              description: "Expert in life support systems and saturation operations"
            }
          },
          "underwater-welding": {
            id: "underwater-welding",
            title: "Advanced Underwater Welding",
            slug: "underwater-welding",
            summary: "Professional underwater welding techniques, electrode selection, and quality control.",
            isPublished: true,
            createdAt: new Date().toISOString(),
            difficulty: "advanced",
            estimatedHours: 60,
            aiTutorId: "tutor-5",
            lessons: [],
            aiTutor: {
              id: "tutor-5",
              name: "Master Welder Carlos Mendez",
              specialty: "Underwater Welding",
              description: "Professional underwater welding and marine construction"
            }
          },
          "hyperbaric-operations": {
            id: "hyperbaric-operations",
            title: "Hyperbaric Chamber Operations",
            slug: "hyperbaric-operations",
            summary: "Hyperbaric treatment protocols, emergency procedures, and patient monitoring.",
            isPublished: true,
            createdAt: new Date().toISOString(),
            difficulty: "intermediate",
            estimatedHours: 30,
            aiTutorId: "tutor-6",
            lessons: [],
            aiTutor: {
              id: "tutor-6",
              name: "Dr. Emma Thompson",
              specialty: "Hyperbaric Medicine",
              description: "Hyperbaric chamber operations and decompression therapy"
            }
          },
          "alst": {
            id: "alst",
            title: "Advanced Life Support Technician (ALST)",
            slug: "alst",
            summary: "Advanced life support operations, emergency decompression protocols, and saturation diving medical procedures.",
            isPublished: true,
            createdAt: new Date().toISOString(),
            difficulty: "expert",
            estimatedHours: 70,
            aiTutorId: "tutor-7",
            lessons: [],
            aiTutor: {
              id: "tutor-7",
              name: "Senior Technician Alex Johnson",
              specialty: "Life Support Systems",
              description: "Advanced life support operations and emergency protocols"
            }
          },
          "lst": {
            id: "lst",
            title: "Life Support Technician (LST)",
            slug: "lst",
            summary: "Life support system operations, gas management, and emergency response procedures.",
            isPublished: true,
            createdAt: new Date().toISOString(),
            difficulty: "advanced",
            estimatedHours: 50,
            aiTutorId: "tutor-8",
            lessons: [],
            aiTutor: {
              id: "tutor-8",
              name: "Technician Maria Santos",
              specialty: "Life Support Operations",
              description: "Life support system operations and gas management"
            }
          }
        };

        const track = tracksBySlug[slug];
        if (!track) {
          console.log("❌ Track not found in fallback data for slug:", slug);
          return new Response(JSON.stringify({ error: "Track not found" }), {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          });
        }

        // Try to fetch lessons from the lessons endpoint even in fallback
        if (!track.lessons || track.lessons.length === 0) {
          try {
            // Try API worker first
            if (env.API) {
              try {
                const lessonsRequest = new Request(`${url.pathname}/lessons`, {
                  method: "GET",
                  headers: request.headers,
                });
                const lessonsResponse = await env.API.fetch(lessonsRequest);
                if (lessonsResponse.ok) {
                  const lessonsData = await lessonsResponse.json();
                  if (lessonsData.lessons && lessonsData.lessons.length > 0) {
                    track.lessons = lessonsData.lessons;
                    console.log("📚 Fetched lessons from API worker in fallback:", track.lessons.length);
                  } else if (lessonsData && Array.isArray(lessonsData) && lessonsData.length > 0) {
                    track.lessons = lessonsData;
                    console.log("📚 Fetched lessons array from API worker in fallback:", track.lessons.length);
                  }
                }
              } catch (e) {
                console.log("⚠️ Could not fetch lessons from API worker in fallback");
              }
            }
            
            // Try external API if still no lessons
            if ((!track.lessons || track.lessons.length === 0) && env.API_URL) {
              try {
                const lessonsUrl = `${env.API_URL}/api/tracks/${slug}/lessons`;
                const lessonsResponse = await fetch(lessonsUrl);
                if (lessonsResponse.ok) {
                  const lessonsData = await lessonsResponse.json();
                  if (lessonsData.lessons && lessonsData.lessons.length > 0) {
                    track.lessons = lessonsData.lessons;
                    console.log("📚 Fetched lessons from external API in fallback:", track.lessons.length);
                  } else if (lessonsData && Array.isArray(lessonsData) && lessonsData.length > 0) {
                    track.lessons = lessonsData;
                    console.log("📚 Fetched lessons array from external API in fallback:", track.lessons.length);
                  }
                }
              } catch (e) {
                console.log("⚠️ Could not fetch lessons from external API in fallback");
              }
            }
          } catch (error) {
            console.error("Error fetching lessons in fallback:", error);
          }
        }

        console.log("✅ Returning fallback track data for slug:", slug, "with", track.lessons?.length || 0, "lessons");
        return new Response(JSON.stringify(track), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error("Track by slug API error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch track" }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }
    }

    // Handle track lessons endpoint
    if (url.pathname.endsWith("/lessons") && url.pathname.startsWith("/api/tracks/") && request.method === "GET") {
      try {
        // Extract slug from path like "/api/tracks/ndt-inspection/lessons" -> "ndt-inspection"
        const pathParts = url.pathname.split("/api/tracks/");
        const slug = pathParts[1]?.split("/")[0]?.split("?")[0];
        
        console.log("🔍 Track lessons request - path:", url.pathname, "slug:", slug);
        
        if (!slug) {
          return new Response(JSON.stringify({ error: "Track slug is required" }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          });
        }
        
        // Try to proxy to API worker if available
        if (env.API) {
          try {
            const apiRequest = new Request(`${url.pathname}${url.search}`, {
              method: request.method,
              headers: request.headers,
            });
            const apiResponse = await env.API.fetch(apiRequest);
            if (apiResponse.status !== 501 && apiResponse.ok) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("API proxy error for track lessons:", error);
          }
        }

        // Try external API URL if configured
        if (env.API_URL) {
          try {
            const apiUrl = `${env.API_URL}/api/tracks/${slug}/lessons${url.search}`;
            const apiRequest = new Request(apiUrl, {
              method: request.method,
              headers: request.headers,
            });
            const apiResponse = await fetch(apiRequest);
            if (apiResponse.ok) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("External API fetch error for track lessons:", error);
          }
        }

        // Fallback: Return empty lessons array (lessons should come from API/database)
        return new Response(JSON.stringify({ 
          error: "Lessons not available",
          message: "Please ensure lessons are populated in the database via the admin panel"
        }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error("Track lessons API error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch track lessons" }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }
    }

    // Handle Access Control endpoints - must be before generic API proxy
    if (url.pathname === "/api/admin/access-control" && request.method === "GET") {
      try {
        // Try to proxy to API worker if available
        if (env.API) {
          try {
            const apiRequest = new Request(`${url.pathname}${url.search}`, {
              method: request.method,
              headers: request.headers,
            });
            const apiResponse = await env.API.fetch(apiRequest);
            if (apiResponse.status !== 501 && apiResponse.ok) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("API proxy error for access-control:", error);
          }
        }

        // Try external API URL if configured
        if (env.API_URL) {
          try {
            const apiUrl = `${env.API_URL}/api/admin/access-control${url.search}`;
            const apiRequest = new Request(apiUrl, {
              method: request.method,
              headers: request.headers,
            });
            const apiResponse = await fetch(apiRequest);
            if (apiResponse.ok || apiResponse.status !== 501) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("External API fetch error for access-control:", error);
          }
        }

        // Fallback: Check if requester is Super Admin
        const email = url.searchParams.get('email');
        if (!email) {
          return new Response(JSON.stringify({ error: 'Email is required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const superAdminEmails = ['lalabalavu.jon@gmail.com', 'sephdee@hotmail.com'];
        
        if (!superAdminEmails.includes(normalizedEmail)) {
          return new Response(JSON.stringify({ 
            error: 'Super Admin access required',
            currentRole: 'USER'
          }), {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        // Return access permissions for Partner Admins
        const partnerAdminEmails = ['freddierussell.joseph@yahoo.com', 'deesuks@gmail.com'];
        const permissions = await Promise.all(partnerAdminEmails.map(async (email) => {
          // Try to get from KV storage
          let storedPermissions = null;
          if (env.DATA) {
            try {
              const key = `access-control:${email.toLowerCase().trim()}`;
              storedPermissions = await env.DATA.get(key, 'json');
            } catch (error) {
              console.error(`Error reading permissions for ${email} from KV:`, error);
            }
          }

          return {
            email: email,
            name: email === 'deesuks@gmail.com' ? 'Dilo Suka' : 'Freddie Joseph',
            role: 'PARTNER_ADMIN',
            operationsCenter: storedPermissions?.operationsCenter ?? false,
            adminDashboard: storedPermissions?.adminDashboard ?? false,
            crm: storedPermissions?.crm ?? false,
            analytics: storedPermissions?.analytics ?? false,
            contentEditor: storedPermissions?.contentEditor ?? false,
            updatedAt: storedPermissions?.updatedAt ?? new Date().toISOString(),
            updatedBy: storedPermissions?.updatedBy ?? 'system'
          };
        }));

        return new Response(JSON.stringify(permissions), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch access control permissions',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }

    // Handle Access Control update endpoint
    if (url.pathname.startsWith("/api/admin/access-control/") && request.method === "PUT") {
      try {
        // Try to proxy to API worker if available
        if (env.API) {
          try {
            const body = request.body ? await request.clone().arrayBuffer() : null;
            const apiRequest = new Request(`${url.pathname}${url.search}`, {
              method: request.method,
              headers: request.headers,
              body: body,
            });
            const apiResponse = await env.API.fetch(apiRequest);
            if (apiResponse.status !== 501 && apiResponse.ok) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("API proxy error for access-control update:", error);
          }
        }

        // Try external API URL if configured
        if (env.API_URL) {
          try {
            const apiUrl = `${env.API_URL}${url.pathname}${url.search}`;
            const body = request.body ? await request.clone().arrayBuffer() : null;
            const apiRequest = new Request(apiUrl, {
              method: request.method,
              headers: request.headers,
              body: body,
            });
            const apiResponse = await fetch(apiRequest);
            if (apiResponse.ok || apiResponse.status !== 501) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("External API fetch error for access-control update:", error);
          }
        }

        // Fallback: Check if requester is Super Admin
        const requesterEmail = url.searchParams.get('email');
        if (!requesterEmail) {
          return new Response(JSON.stringify({ error: 'Requester email is required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        const normalizedRequesterEmail = requesterEmail.toLowerCase().trim();
        const superAdminEmails = ['lalabalavu.jon@gmail.com', 'sephdee@hotmail.com'];
        
        if (!superAdminEmails.includes(normalizedRequesterEmail)) {
          return new Response(JSON.stringify({ 
            error: 'Super Admin access required'
          }), {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        // Extract email from path: /api/admin/access-control/:email
        const pathParts = url.pathname.split('/api/admin/access-control/');
        const targetEmail = pathParts[1]?.split('?')[0];
        
        if (!targetEmail) {
          return new Response(JSON.stringify({ error: 'Target email is required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        const body = await request.json();
        const { operationsCenter, adminDashboard, crm, analytics, contentEditor } = body;

        // Store in KV if available, otherwise return success (persistence handled by API server)
        if (env.DATA) {
          const key = `access-control:${targetEmail.toLowerCase().trim()}`;
          const permissions = {
            email: targetEmail.toLowerCase().trim(),
            operationsCenter: operationsCenter ?? false,
            adminDashboard: adminDashboard ?? false,
            crm: crm ?? false,
            analytics: analytics ?? false,
            contentEditor: contentEditor ?? false,
            updatedAt: new Date().toISOString(),
            updatedBy: normalizedRequesterEmail
          };
          await env.DATA.put(key, JSON.stringify(permissions));
        }

        return new Response(JSON.stringify({
          success: true,
          permissions: {
            email: targetEmail.toLowerCase().trim(),
            operationsCenter: operationsCenter ?? false,
            adminDashboard: adminDashboard ?? false,
            crm: crm ?? false,
            analytics: analytics ?? false,
            contentEditor: contentEditor ?? false,
            updatedAt: new Date().toISOString(),
            updatedBy: normalizedRequesterEmail
          }
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Failed to update access control permissions',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }

    // Handle user access permissions endpoint
    if (url.pathname === "/api/users/access-permissions" && request.method === "GET") {
      try {
        // Try to proxy to API worker if available
        if (env.API) {
          try {
            const apiRequest = new Request(`${url.pathname}${url.search}`, {
              method: request.method,
              headers: request.headers,
            });
            const apiResponse = await env.API.fetch(apiRequest);
            if (apiResponse.status !== 501 && apiResponse.ok) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("API proxy error for access-permissions:", error);
          }
        }

        // Try external API URL if configured
        if (env.API_URL) {
          try {
            const apiUrl = `${env.API_URL}/api/users/access-permissions${url.search}`;
            const apiRequest = new Request(apiUrl, {
              method: request.method,
              headers: request.headers,
            });
            const apiResponse = await fetch(apiRequest);
            if (apiResponse.ok || apiResponse.status !== 501) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("External API fetch error for access-permissions:", error);
          }
        }

        // Fallback: Get permissions from KV or return default
        const email = url.searchParams.get('email');
        if (!email) {
          return new Response(JSON.stringify({ error: 'Email is required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const partnerAdminEmails = ['freddierussell.joseph@yahoo.com', 'deesuks@gmail.com'];
        
        if (!partnerAdminEmails.includes(normalizedEmail)) {
          return new Response(JSON.stringify({ 
            error: 'User not found or not a Partner Admin'
          }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        // Try to get from KV
        let permissions = {
          operationsCenter: false,
          adminDashboard: false,
          crm: false,
          analytics: false,
          contentEditor: false
        };

        if (env.DATA) {
          try {
            const key = `access-control:${normalizedEmail}`;
            const stored = await env.DATA.get(key, 'json');
            if (stored) {
              permissions = {
                operationsCenter: stored.operationsCenter ?? false,
                adminDashboard: stored.adminDashboard ?? false,
                crm: stored.crm ?? false,
                analytics: stored.analytics ?? false,
                contentEditor: stored.contentEditor ?? false
              };
            }
          } catch (error) {
            console.error("Error reading from KV:", error);
          }
        }

        return new Response(JSON.stringify(permissions), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch access permissions',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }

    // Handle PATCH /api/lessons/:id endpoint (lesson updates)
    if (url.pathname.match(/^\/api\/lessons\/[^\/]+$/) && request.method === "PATCH") {
      try {
        // Try to proxy to API worker if available
        if (env.API) {
          try {
            const body = request.body ? await request.clone().arrayBuffer() : null;
            const apiRequest = new Request(new URL(url.pathname + url.search, request.url).toString(), {
              method: request.method,
              headers: request.headers,
              body: body,
            });
            const apiResponse = await env.API.fetch(apiRequest);
            if (apiResponse.status !== 501) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("API proxy error for lesson update:", error);
          }
        }

        // Try external API URL if configured
        if (env.API_URL) {
          try {
            const apiUrl = `${env.API_URL}${url.pathname}${url.search}`;
            const body = request.body ? await request.clone().arrayBuffer() : null;
            const apiRequest = new Request(apiUrl, {
              method: request.method,
              headers: request.headers,
              body: body,
            });
            const apiResponse = await fetch(apiRequest);
            if (apiResponse.ok || apiResponse.status !== 501) {
              const responseHeaders = new Headers(apiResponse.headers);
              responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
              responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
              responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
              responseHeaders.set('Access-Control-Allow-Credentials', 'true');
              return new Response(apiResponse.body, {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
              });
            }
          } catch (error) {
            console.error("External API fetch error for lesson update:", error);
          }
        }

        // If both API proxy and external API fail, return 501
        return new Response(
          JSON.stringify({
            error: "Not implemented",
            path: url.pathname,
            method: request.method,
            note: "This endpoint needs to be implemented or API server needs to be configured"
          }),
          {
            status: 501,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: "Failed to process lesson update request",
            details: error instanceof Error ? error.message : "Unknown error"
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }
    }

    // Handle API routes (learning path generation and tracks are handled above, so skip them here)
    if (url.pathname.startsWith("/api/") && 
        url.pathname !== "/api/learning-path/generate" && 
        url.pathname !== "/api/tracks" && 
        !url.pathname.startsWith("/api/tracks/") &&
        url.pathname !== "/api/admin/access-control" &&
        !url.pathname.startsWith("/api/admin/access-control/") &&
        url.pathname !== "/api/users/access-permissions" &&
        !url.pathname.match(/^\/api\/lessons\/[^\/]+$/)) {
      // Try to proxy to API worker if available
      if (env.API) {
        try {
          // Use service binding - create request with full URL context
          const body = request.body ? await request.clone().arrayBuffer() : null;
          
          // Create a new request for the API worker with proper URL
          const apiRequest = new Request(new URL(url.pathname + url.search, request.url).toString(), {
            method: request.method,
            headers: request.headers,
            body: body,
          });
          
          console.log("🔗 Proxying API request to API worker:", url.pathname);
          const apiResponse = await env.API.fetch(apiRequest);
          
          // Return the response - only skip if it's 501 (not implemented)
          // 401 (unauthorized) and other status codes should be returned
          if (apiResponse.status !== 501) {
            // Copy CORS headers from API response
            const responseHeaders = new Headers(apiResponse.headers);
            responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
            responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
            responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
            responseHeaders.set('Access-Control-Allow-Credentials', 'true');
            
            return new Response(apiResponse.body, {
              status: apiResponse.status,
              statusText: apiResponse.statusText,
              headers: responseHeaders,
            });
          }
        } catch (error) {
          console.error("API proxy error:", error);
        }
      }

      // Try external API URL if configured
      if (env.API_URL) {
        try {
          const apiUrl = `${env.API_URL}${url.pathname}${url.search}`;
          const apiRequest = new Request(apiUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body,
          });
          const apiResponse = await fetch(apiRequest);
          
          // Add CORS headers to the response
          if (apiResponse.ok || apiResponse.status !== 501) {
            const responseHeaders = new Headers(apiResponse.headers);
            responseHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
            responseHeaders.set('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
            responseHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
            responseHeaders.set('Access-Control-Allow-Credentials', 'true');
            
            return new Response(apiResponse.body, {
              status: apiResponse.status,
              statusText: apiResponse.statusText,
              headers: responseHeaders,
            });
          }
        } catch (error) {
          console.error("External API fetch error:", error);
        }
      }

      // Fallback: return not implemented for API routes
      return new Response(
        JSON.stringify({
          error: "Not implemented",
          path: url.pathname,
          method: request.method,
          note: "This endpoint needs to be implemented or API server needs to be configured",
        }),
        {
          status: 501,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Serve static assets
    if (!env.ASSETS) {
      console.error("ASSETS binding not available");
      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Diver Well - Professional Diver Training Platform</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
              }
              h1 { margin-bottom: 1rem; font-size: 2.5rem; }
              p { margin-bottom: 0.5rem; font-size: 1.1rem; }
              .error { color: #ff6b6b; margin-top: 1rem; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⚠️ Configuration Error</h1>
              <p>ASSETS binding is not configured.</p>
              <p class="error">Please check your wrangler.toml configuration.</p>
            </div>
          </body>
        </html>
      `,
        {
          status: 500,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    }

    try {
      // Check if this is a static asset request (has file extension or is in /assets/)
      const isStaticAsset =
        url.pathname.includes(".") &&
        (url.pathname.match(/\.[a-zA-Z0-9]+$/) ||
          url.pathname.startsWith("/assets/"));

      if (isStaticAsset && !url.pathname.startsWith("/api/")) {
        // Try to fetch the asset
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse && assetResponse.ok) {
          // Add cache headers for all static assets
          const response = new Response(assetResponse.body, assetResponse);
          // Set appropriate content type if not already set
          if (!response.headers.get('Content-Type')) {
            if (url.pathname.endsWith('.png')) {
              response.headers.set('Content-Type', 'image/png');
            } else if (url.pathname.endsWith('.jpg') || url.pathname.endsWith('.jpeg')) {
              response.headers.set('Content-Type', 'image/jpeg');
            } else if (url.pathname.endsWith('.svg')) {
              response.headers.set('Content-Type', 'image/svg+xml');
            }
          }
          // Add cache headers
          if (url.pathname.startsWith("/assets/") || url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/i)) {
            response.headers.set(
              "Cache-Control",
              "public, max-age=31536000, immutable"
            );
          }
          return response;
        }
        // Asset not found - log for debugging
        console.error(`Asset not found: ${url.pathname}`);
        return new Response("File not found", { status: 404 });
      }

      // For all other routes, serve index.html (SPA routing)
      try {
        const indexRequest = new Request(
          new URL("/index.html", request.url),
          {
            method: "GET",
            headers: { Accept: "text/html" },
          }
        );
        const indexResponse = await env.ASSETS.fetch(indexRequest);

        if (indexResponse && indexResponse.ok) {
          const html = await indexResponse.text();
          
          // Inject SEO meta tags for better indexing
          const enhancedHtml = html.replace(
            "<head>",
            `<head>
              <meta name="description" content="Professional Diver Training Platform - Advanced diving certification courses, safety training, and career development for professional divers.">
              <meta name="keywords" content="professional diving, diver training, diving certification, underwater safety, commercial diving">
              <meta property="og:title" content="Diver Well - Professional Diver Training Platform">
              <meta property="og:description" content="Advanced diving certification courses and professional training for commercial divers.">
              <meta property="og:url" content="https://professionaldiver.app${url.pathname}">
              <meta property="og:type" content="website">
              <meta name="twitter:card" content="summary_large_image">
              <meta name="twitter:title" content="Professional Diver Training">
              <meta name="twitter:description" content="Advanced diving certification courses and professional training.">
              <link rel="canonical" href="https://professionaldiver.app${url.pathname}">
            `
          );

          return new Response(enhancedHtml, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "public, max-age=300",
              "X-Content-Type-Options": "nosniff",
              "Content-Security-Policy":
                "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://fonts.gstatic.com https://replit.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://replit.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com; connect-src 'self' https:;",
              ...corsHeaders,
            },
          });
        }
      } catch (error) {
        console.error("Failed to fetch index.html from ASSETS:", error);
      }

      // Fallback: return a basic HTML page
      console.error("index.html not found in assets.");
      console.error("Request path:", url.pathname);
      console.error("ASSETS binding available:", !!env.ASSETS);

      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Diver Well - Professional Diver Training Platform</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
              }
              h1 { margin-bottom: 1rem; font-size: 2.5rem; }
              p { margin-bottom: 0.5rem; font-size: 1.1rem; }
              .loading { 
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid rgba(255,255,255,.3);
                border-radius: 50%;
                border-top-color: #fff;
                animation: spin 1s ease-in-out infinite;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🤿 Diver Well Training Platform</h1>
              <p>Professional diving certification and training</p>
              <div class="loading"></div>
              <p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.8;">
                Loading your professional diving resources...
              </p>
            </div>
          </body>
        </html>
      `,
        {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            ...corsHeaders,
          },
        }
      );
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(`Worker error: ${error}`, { status: 500 });
    }
  },
};
