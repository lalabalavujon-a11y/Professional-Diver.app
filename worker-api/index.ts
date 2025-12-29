/**
 * Cloudflare Worker for API endpoints
 * Handles all /api/* routes for professionaldiver.app
 * Uses Cloudflare D1 database for data persistence
 */

import { getDatabase } from './db';
import { users, tracks, lessons, aiTutors } from '@shared/schema-sqlite';
import { eq, count } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

interface Env {
  DB?: D1Database; // D1 database binding
  DATA?: KVNamespace; // KV namespace for caching
  API_URL?: string; // Fallback to Express server if needed
  ENVIRONMENT?: string;
  NODE_ENV?: string;
}

// Helper function to generate lessons for a track
function generateLessonsForTrack(slug: string, trackTitle: string): Array<{ title: string; content: string }> {
  const lessonTitles: { [key: string]: string[] } = {
    'ndt-inspection': [
      'Introduction to NDT Inspection',
      'Visual Inspection Techniques',
      'Magnetic Particle Testing Fundamentals',
      'Ultrasonic Testing Principles',
      'Dye Penetrant Testing',
      'Radiographic Testing Basics',
      'Underwater Inspection Procedures',
      'Data Recording and Documentation',
      'Quality Assurance Standards',
      'Safety Protocols for NDT',
      'Advanced Inspection Methods',
      'Certification and Compliance'
    ],
    'diver-medic': [
      'Introduction to Diver Medicine',
      'ABCDE Assessment Protocol',
      'Diving Injury Recognition',
      'Emergency Response Procedures',
      'Oxygen Administration',
      'Decompression Sickness Treatment',
      'Barotrauma Management',
      'Hypothermia and Hyperthermia',
      'Cardiac Emergencies Underwater',
      'Medication Administration',
      'Evacuation Procedures',
      'Advanced Life Support'
    ],
    'commercial-supervisor': [
      'Supervisor Responsibilities',
      'Dive Planning and Risk Assessment',
      'Team Management',
      'Safety Protocol Enforcement',
      'Emergency Response Leadership',
      'Communication Systems',
      'Equipment Management',
      'Regulatory Compliance',
      'Incident Reporting',
      'Team Training and Development',
      'Project Management',
      'Advanced Leadership Skills'
    ],
    'saturation-diving': [
      'Saturation Diving Fundamentals',
      'Life Support Systems',
      'Decompression Theory',
      'Chamber Operations',
      'Gas Management',
      'Emergency Procedures',
      'Dive Bell Operations',
      'Personnel Transfer',
      'Medical Monitoring',
      'Equipment Maintenance',
      'Deep Sea Operations',
      'Advanced Saturation Techniques'
    ],
    'underwater-welding': [
      'Underwater Welding Introduction',
      'Welding Equipment and Safety',
      'Electrode Selection',
      'Welding Techniques',
      'Quality Control Methods',
      'Weld Inspection',
      'Underwater Cutting',
      'Marine Construction',
      'Pipeline Welding',
      'Structural Welding',
      'Advanced Welding Methods',
      'Certification and Standards'
    ],
    'hyperbaric-operations': [
      'Hyperbaric Chamber Fundamentals',
      'Chamber Operations',
      'Patient Monitoring',
      'Treatment Protocols',
      'Emergency Procedures',
      'Gas Management',
      'Medical Equipment',
      'Safety Protocols',
      'Decompression Procedures',
      'Maintenance and Inspection',
      'Advanced Treatments',
      'Regulatory Compliance'
    ],
    'alst': [
      'ALST Introduction',
      'Life Support Systems Basics',
      'Gas Management',
      'Emergency Procedures',
      'Equipment Operation',
      'Maintenance Protocols',
      'Safety Standards',
      'Team Coordination',
      'Advanced Systems',
      'Troubleshooting',
      'Certification Requirements',
      'Professional Development'
    ],
    'lst': [
      'LST Advanced Concepts',
      'Complex Life Support Systems',
      'Advanced Gas Management',
      'Emergency Response Leadership',
      'System Integration',
      'Quality Assurance',
      'Training and Supervision',
      'Advanced Troubleshooting',
      'Regulatory Compliance',
      'Professional Standards',
      'Continuous Improvement',
      'Expert Certification'
    ],
    'air-diver': [
      'Air Diving Fundamentals',
      'Diving Equipment',
      'Dive Planning',
      'Underwater Navigation',
      'Emergency Procedures',
      'Decompression Procedures',
      'Underwater Work Techniques',
      'Communication Methods',
      'Safety Protocols',
      'Equipment Maintenance',
      'Advanced Techniques',
      'Certification Process'
    ],
    'air-diver-certification': [
      'Diving Physics Review',
      'Gas Laws & Pressure Effects',
      'Decompression Theory',
      'Safety Calculations',
      'Gas Management Concepts',
      'Ascent Best Practices',
      'Problem-Solving Drills',
      'Tool Handling Safety',
      'Basic Communications',
      'Emergency Procedures',
      'Equipment Operation',
      'Certification Requirements'
    ]
  };

  const titles = lessonTitles[slug] || Array.from({ length: 12 }, (_, i) => `Lesson ${i + 1}`);
  
  return titles.map((title, index) => ({
    title,
    content: `# ${title}\n\n## Overview\n\nWelcome to ${title} of the ${trackTitle} track. This lesson covers essential concepts and practical applications.\n\n## Learning Objectives\n\n- Understand key concepts\n- Apply practical skills\n- Demonstrate competency\n\n## Core Content\n\nThis lesson provides comprehensive coverage of ${title.toLowerCase()} within the context of ${trackTitle}.\n\n## Assessment\n\nComplete the quiz at the end of this lesson to demonstrate your understanding.\n\n## Next Steps\n\nAfter completing this lesson, proceed to the next lesson in the track.`
  }));
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS headers - Restricted to production domains only
    const allowedOrigins = [
      'https://professionaldiver.app',
      'https://www.professionaldiver.app',
      // Allow localhost only in development
      ...(env.ENVIRONMENT !== 'production' ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : [])
    ];
    
    const origin = request.headers.get('origin');
    const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Health check
    if (url.pathname === '/health' || url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'API Worker',
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Authentication endpoint - Uses D1 database for authentication
    if (url.pathname === '/api/auth/credentials' && request.method === 'POST') {
      try {
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

        // Use D1 database if available
        if (env.DB) {
          try {
            const db = getDatabase(env.DB);
            const userResults = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
            
            if (userResults.length === 0) {
              return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                status: 401,
                headers: {
                  'Content-Type': 'application/json',
                  ...corsHeaders,
                },
              });
            }

            const user = userResults[0];
            
            // Verify password if user has one (OAuth users may not have passwords)
            if (user.password) {
              // Note: bcryptjs may not work in Workers, consider using Web Crypto API
              // For now, we'll try bcryptjs with error handling
              try {
                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) {
                  return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                    status: 401,
                    headers: {
                      'Content-Type': 'application/json',
                      ...corsHeaders,
                    },
                  });
                }
              } catch (bcryptError) {
                // Fallback: if bcrypt fails, check if password matches directly (for migration)
                // This should be removed once all passwords are properly hashed
                if (password !== user.password) {
                  return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                    status: 401,
                    headers: {
                      'Content-Type': 'application/json',
                      ...corsHeaders,
                    },
                  });
                }
              }
            } else if (password) {
              // User exists but has no password (OAuth user) and password was provided
              return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                status: 401,
                headers: {
                  'Content-Type': 'application/json',
                  ...corsHeaders,
                },
              });
            }

            // Authentication successful
            return new Response(JSON.stringify({
              success: true,
              user: {
                id: user.id,
                email: user.email,
                name: user.name || 'User',
                role: user.role,
                subscriptionType: user.subscriptionType,
                subscriptionStatus: user.subscriptionStatus,
              },
              rememberMe: rememberMe || false
            }), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            });
          } catch (dbError) {
            console.error('Database error during authentication:', dbError);
            // Fall through to fallback handler
          }
        }

        // Fallback: If D1 is not available, try to proxy to Express server
        if (env.API_URL) {
          try {
            const apiUrl = `${env.API_URL}/api/auth/credentials`;
            const proxyRequest = new Request(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...Object.fromEntries(request.headers.entries()),
              },
              body: JSON.stringify(body),
            });
            
            const proxyResponse = await fetch(proxyRequest);
            const responseBody = await proxyResponse.text();
            
            return new Response(responseBody, {
              status: proxyResponse.status,
              statusText: proxyResponse.statusText,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            });
          } catch (proxyError) {
            console.error('Failed to proxy to Express server:', proxyError);
          }
        }

        // Final fallback: return error
        return new Response(JSON.stringify({ 
          error: 'Authentication service unavailable',
          note: 'Database not configured. Please set up D1 database or configure API_URL.'
        }), {
          status: 503,
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

    // Get current user endpoint - Uses D1 database
    if (url.pathname === '/api/users/current' && request.method === 'GET') {
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

      // Use D1 database if available
      if (env.DB) {
        try {
          const db = getDatabase(env.DB);
          const userResults = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
          
          if (userResults.length > 0) {
            const user = userResults[0];
            return new Response(JSON.stringify({
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              subscriptionType: user.subscriptionType,
              subscriptionStatus: user.subscriptionStatus,
            }), {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            });
          }
        } catch (dbError) {
          console.error('Database error getting user:', dbError);
        }
      }

      // Fallback: Try to proxy to Express server
      if (env.API_URL) {
        try {
          const apiUrl = `${env.API_URL}/api/users/current${url.search}`;
          const proxyRequest = new Request(apiUrl, {
            method: 'GET',
            headers: request.headers,
          });
          const proxyResponse = await fetch(proxyRequest);
          if (proxyResponse.ok) {
            return new Response(await proxyResponse.text(), {
              status: proxyResponse.status,
              statusText: proxyResponse.statusText,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            });
          }
        } catch (error) {
          console.error('Failed to proxy to Express server for /api/users/current:', error);
        }
      }

      // Final fallback: return default user
      return new Response(JSON.stringify({
        email: normalizedEmail,
        role: 'USER',
        subscriptionType: 'TRIAL'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Profile update endpoint
    if (url.pathname === '/api/users/profile' && request.method === 'PUT') {
      try {
        // Try to proxy to Express server first if available
        if (env.API_URL) {
          try {
            const apiUrl = `${env.API_URL}/api/users/profile`;
            const body = await request.clone().text();
            const proxyRequest = new Request(apiUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                ...Object.fromEntries(request.headers.entries()),
              },
              body: body,
            });
            
            const proxyResponse = await fetch(proxyRequest);
            const responseBody = await proxyResponse.text();
            
            return new Response(responseBody, {
              status: proxyResponse.status,
              statusText: proxyResponse.statusText,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            });
          } catch (proxyError) {
            console.error('Failed to proxy to Express server for profile update:', proxyError);
            // Fall through to local handler
          }
        }

        // Local handler - update D1 database
        const body = await request.json();
        const { name, email, phone, bio, company, jobTitle, location, currentEmail, status, timezone, useGravatar, profilePictureUrl, profilePictureURL } = body;
        const userEmail = request.headers.get('x-user-email') || currentEmail || email;
        
        if (!userEmail) {
          return new Response(JSON.stringify({ error: 'User email is required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        const normalizedEmail = userEmail.toLowerCase().trim();

        // Update user in D1 database if available
        if (env.DB) {
          try {
            const db = getDatabase(env.DB);
            const userResults = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
            
            if (userResults.length > 0) {
              // Update existing user - only update fields that exist in the schema
              const updateData: any = {
                updatedAt: new Date(),
              };
              
              if (name !== undefined) updateData.name = name;
              if (status !== undefined) updateData.subscriptionStatus = status;

              await db.update(users)
                .set(updateData)
                .where(eq(users.email, normalizedEmail));

              // Fetch updated user
              const updatedUserResults = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
              if (updatedUserResults.length > 0) {
                const dbUser = updatedUserResults[0];
                
                // Get existing profile data from KV
                let existingProfile: any = {};
                if (env.DATA) {
                  try {
                    const profileData = await env.DATA.get(`user:${normalizedEmail}:profile`);
                    if (profileData) {
                      existingProfile = JSON.parse(profileData);
                    }
                  } catch (kvError) {
                    console.error('Error reading profile from KV:', kvError);
                  }
                }
                
                // Merge with additional profile data
                const profileData = {
                  ...dbUser,
                  phone: phone !== undefined ? phone : (existingProfile.phone || ''),
                  bio: bio !== undefined ? bio : (existingProfile.bio || ''),
                  company: company !== undefined ? company : (existingProfile.company || ''),
                  jobTitle: jobTitle !== undefined ? jobTitle : (existingProfile.jobTitle || ''),
                  location: location !== undefined ? location : (existingProfile.location || ''),
                  timezone: timezone !== undefined ? timezone : (existingProfile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone),
                  useGravatar: useGravatar !== undefined ? useGravatar : (existingProfile.useGravatar ?? false),
                  profilePictureUrl: body.profilePictureUrl || existingProfile.profilePictureUrl || body.profilePictureURL || existingProfile.profilePictureURL || '',
                };
                
                // Store additional profile data in KV
                if (env.DATA) {
                  try {
                    await env.DATA.put(`user:${normalizedEmail}:profile`, JSON.stringify(profileData));
                  } catch (kvError) {
                    console.error('Error storing profile in KV:', kvError);
                  }
                }
                
                return new Response(JSON.stringify(profileData), {
                  status: 200,
                  headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders,
                  },
                });
              }
            }
          } catch (dbError) {
            console.error('Database error updating profile:', dbError);
            // Fall through to KV fallback
          }
        }

        // Fallback: Store in KV for persistence if D1 update failed
        let existingUser = null;
        if (env.DATA) {
          try {
            const userData = await env.DATA.get(`user:${normalizedEmail}`);
            if (userData) {
              existingUser = JSON.parse(userData);
            }
          } catch (error) {
            console.error('Error reading from KV:', error);
          }
        }

        // Update user data
        const updatedUser = {
          ...existingUser,
          id: existingUser?.id || `user-${normalizedEmail.replace('@', '-').replace(/\./g, '-')}`,
          email: normalizedEmail,
          name: name !== undefined ? name : (existingUser?.name || 'User'),
          phone: phone !== undefined ? phone : (existingUser?.phone || ''),
          bio: bio !== undefined ? bio : (existingUser?.bio || ''),
          company: company !== undefined ? company : (existingUser?.company || ''),
          jobTitle: jobTitle !== undefined ? jobTitle : (existingUser?.jobTitle || ''),
          location: location !== undefined ? location : (existingUser?.location || ''),
          timezone: timezone !== undefined ? timezone : (existingUser?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone),
          useGravatar: useGravatar !== undefined ? useGravatar : (existingUser?.useGravatar ?? false),
          profilePictureUrl: profilePictureUrl || profilePictureURL || existingUser?.profilePictureUrl || existingUser?.profilePictureURL || '',
          subscriptionStatus: status !== undefined ? status : (existingUser?.subscriptionStatus || existingUser?.status || 'ACTIVE'),
          role: existingUser?.role || 'USER',
          subscriptionType: existingUser?.subscriptionType || 'TRIAL',
          updatedAt: new Date().toISOString(),
        };

        // Store in KV if available
        if (env.DATA) {
          try {
            await env.DATA.put(`user:${normalizedEmail}`, JSON.stringify(updatedUser));
          } catch (error) {
            console.error('Error writing to KV:', error);
          }
        }

        return new Response(JSON.stringify(updatedUser), {
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

    // Get all tracks endpoint
    if (url.pathname === '/api/tracks' && request.method === 'GET') {
      try {
        if (!env.DB) {
          return new Response(JSON.stringify({ error: 'Database not configured' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const db = getDatabase(env.DB);
        
        // Ensure all 9 tracks exist
        const requiredTracks = [
          { id: 'ndt-inspection-track', title: 'Inspection & Non-Destructive Testing (NDT)', slug: 'ndt-inspection', summary: 'Master visual inspection, magnetic particle testing, and ultrasonic testing for professional certification.', difficulty: 'advanced', estimatedHours: 40 },
          { id: 'diver-medic-track', title: 'Diver Medic Technician (DMT)', slug: 'diver-medic', summary: 'Emergency medical response, ABCDE assessment, and diving injury treatment certification.', difficulty: 'expert', estimatedHours: 60 },
          { id: 'commercial-supervisor-track', title: 'Commercial Dive Supervisor', slug: 'commercial-supervisor', summary: 'Dive operations management, safety protocols, and emergency response leadership.', difficulty: 'expert', estimatedHours: 50 },
          { id: 'saturation-diving-track', title: 'Saturation Diving Systems', slug: 'saturation-diving', summary: 'Saturation diving operations, life support systems, and decompression management.', difficulty: 'expert', estimatedHours: 80 },
          { id: 'underwater-welding-track', title: 'Advanced Underwater Welding', slug: 'underwater-welding', summary: 'Professional underwater welding techniques, electrode selection, and quality control.', difficulty: 'advanced', estimatedHours: 60 },
          { id: 'hyperbaric-operations-track', title: 'Hyperbaric Chamber Operations', slug: 'hyperbaric-operations', summary: 'Hyperbaric treatment protocols, emergency procedures, and patient monitoring.', difficulty: 'intermediate', estimatedHours: 30 },
          { id: 'alst-track', title: 'Assistant Life Support Technician (ALST)', slug: 'alst', summary: 'Advanced life support operations, emergency decompression protocols, and saturation diving medical procedures.', difficulty: 'expert', estimatedHours: 70 },
          { id: 'lst-track', title: 'Life Support Technician (LST)', slug: 'lst', summary: 'Life support system operations, gas management, and emergency response procedures.', difficulty: 'advanced', estimatedHours: 50 },
          { id: 'air-diver-track', title: 'Air Diver Certification', slug: 'air-diver-certification', summary: 'Essential air diving skills including diving physics review, gas management concepts, ascent best practices, problem-solving drills, tool handling safety, and basic communications.', difficulty: 'intermediate', estimatedHours: 40 },
        ];

        // Check and create missing tracks
        for (const requiredTrack of requiredTracks) {
          try {
            const existing = await db.select().from(tracks).where(eq(tracks.slug, requiredTrack.slug)).limit(1);
            if (existing.length === 0) {
              await db.insert(tracks).values({
                id: requiredTrack.id,
                title: requiredTrack.title,
                slug: requiredTrack.slug,
                summary: requiredTrack.summary,
                isPublished: true,
                difficulty: requiredTrack.difficulty as any,
                estimatedHours: requiredTrack.estimatedHours,
                createdAt: new Date(),
              });
              console.log(`✅ Auto-created missing track: ${requiredTrack.title}`);
            }
          } catch (error) {
            console.error(`Error checking/creating track ${requiredTrack.slug}:`, error);
          }
        }

        const allTracks = await db.select({
          id: tracks.id,
          title: tracks.title,
          slug: tracks.slug,
          summary: tracks.summary,
          isPublished: tracks.isPublished,
          createdAt: tracks.createdAt,
          aiTutor: {
            id: aiTutors.id,
            name: aiTutors.name,
            specialty: aiTutors.specialty,
            description: aiTutors.description,
          }
        }).from(tracks)
          .leftJoin(aiTutors, eq(tracks.aiTutorId, aiTutors.id))
          .where(eq(tracks.isPublished, true))
          .orderBy(tracks.title);

        // Get lesson counts for each track
        const tracksWithLessonCounts = await Promise.all(
          allTracks.map(async (track) => {
            const lessonCountResult = await db.select({ count: count() })
              .from(lessons)
              .where(eq(lessons.trackId, track.id));
            
            return {
              ...track,
              lessonCount: lessonCountResult[0]?.count || 0,
            };
          })
        );

        return new Response(JSON.stringify(tracksWithLessonCounts), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (error) {
        console.error('Error fetching tracks:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch tracks' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // Get lesson by ID endpoint
    if (url.pathname.startsWith('/api/lessons/') && request.method === 'GET') {
      try {
        if (!env.DB) {
          return new Response(JSON.stringify({ error: 'Database not configured' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const lessonId = url.pathname.split('/api/lessons/')[1]?.split('/')[0]?.split('?')[0];
        if (!lessonId) {
          return new Response(JSON.stringify({ error: 'Lesson ID is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const db = getDatabase(env.DB);
        
        // Get lesson with track information
        const lessonResults = await db.select({
          id: lessons.id,
          trackId: lessons.trackId,
          title: lessons.title,
          order: lessons.order,
          content: lessons.content,
          estimatedMinutes: lessons.estimatedMinutes,
          isRequired: lessons.isRequired,
          createdAt: lessons.createdAt,
          updatedAt: lessons.updatedAt,
          trackSlug: tracks.slug,
          trackTitle: tracks.title,
        }).from(lessons)
          .leftJoin(tracks, eq(lessons.trackId, tracks.id))
          .where(eq(lessons.id, lessonId))
          .limit(1);

        if (lessonResults.length === 0) {
          return new Response(JSON.stringify({ error: 'Lesson not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const lesson = lessonResults[0];

        // Get total lessons in track for proper lesson numbering
        const trackLessons = await db.select({ count: count() })
          .from(lessons)
          .where(eq(lessons.trackId, lesson.trackId));
        
        const totalLessons = trackLessons[0]?.count || 0;

        const lessonResponse = {
          ...lesson,
          totalLessons,
        };

        return new Response(JSON.stringify(lessonResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (error) {
        console.error('Error fetching lesson:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch lesson' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // Get track by slug endpoint with auto-population
    if (url.pathname.startsWith('/api/tracks/') && 
        !url.pathname.endsWith('/lessons') && 
        request.method === 'GET') {
      try {
        if (!env.DB) {
          return new Response(JSON.stringify({ error: 'Database not configured' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const slug = url.pathname.split('/api/tracks/')[1]?.split('/')[0]?.split('?')[0];
        if (!slug) {
          return new Response(JSON.stringify({ error: 'Track slug is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const db = getDatabase(env.DB);
        
        // Get track
        const trackResults = await db.select({
          id: tracks.id,
          title: tracks.title,
          slug: tracks.slug,
          summary: tracks.summary,
          isPublished: tracks.isPublished,
          createdAt: tracks.createdAt,
          aiTutor: {
            id: aiTutors.id,
            name: aiTutors.name,
            specialty: aiTutors.specialty,
            description: aiTutors.description,
          }
        }).from(tracks)
          .leftJoin(aiTutors, eq(tracks.aiTutorId, aiTutors.id))
          .where(eq(tracks.slug, slug))
          .limit(1);

        if (trackResults.length === 0) {
          return new Response(JSON.stringify({ error: 'Track not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const track = trackResults[0];

        // Get lessons for this track
        let trackLessons = await db.select({
          id: lessons.id,
          trackId: lessons.trackId,
          title: lessons.title,
          order: lessons.order,
          content: lessons.content,
          createdAt: lessons.createdAt,
          updatedAt: lessons.updatedAt,
        }).from(lessons)
          .where(eq(lessons.trackId, track.id))
          .orderBy(lessons.order);

        // Auto-populate lessons if none exist
        if (trackLessons.length === 0) {
          try {
            // Generate 12 lessons for the track
            const lessonsToAdd = generateLessonsForTrack(slug, track.title);

            // Insert lessons into D1 database
            for (let i = 0; i < lessonsToAdd.length; i++) {
              const lesson = lessonsToAdd[i];
              await db.insert(lessons).values({
                trackId: track.id,
                title: lesson.title,
                order: i + 1,
                content: lesson.content,
                estimatedMinutes: 60,
                isRequired: true,
              });
            }

            // Fetch the newly created lessons
            trackLessons = await db.select({
              id: lessons.id,
              trackId: lessons.trackId,
              title: lessons.title,
              order: lessons.order,
              content: lessons.content,
              createdAt: lessons.createdAt,
              updatedAt: lessons.updatedAt,
            }).from(lessons)
              .where(eq(lessons.trackId, track.id))
              .orderBy(lessons.order);

            console.log(`✅ Auto-populated ${lessonsToAdd.length} lessons for track: ${track.title}`);
          } catch (populateError) {
            console.error(`Error populating lessons for track ${slug}:`, populateError);
            // Continue even if population fails
          }
        }

        // Flatten the track object (remove nested aiTutor structure)
        const trackResponse = {
          id: track.id,
          title: track.title,
          slug: track.slug,
          summary: track.summary,
          isPublished: track.isPublished,
          createdAt: track.createdAt,
          aiTutor: track.aiTutor || null,
          lessons: trackLessons || []
        };

        return new Response(JSON.stringify(trackResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (error) {
        console.error('Error fetching track:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch track' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // Get track lessons endpoint
    if (url.pathname.endsWith('/lessons') && url.pathname.startsWith('/api/tracks/') && request.method === 'GET') {
      try {
        if (!env.DB) {
          return new Response(JSON.stringify({ error: 'Database not configured' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const slug = url.pathname.split('/api/tracks/')[1]?.split('/')[0]?.split('?')[0];
        if (!slug) {
          return new Response(JSON.stringify({ error: 'Track slug is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const db = getDatabase(env.DB);
        
        // Get track first
        const trackResults = await db.select().from(tracks).where(eq(tracks.slug, slug)).limit(1);
        if (trackResults.length === 0) {
          return new Response(JSON.stringify({ error: 'Track not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        const track = trackResults[0];
        
        // Get lessons
        const trackLessons = await db.select().from(lessons)
          .where(eq(lessons.trackId, track.id))
          .orderBy(lessons.order);

        return new Response(JSON.stringify({
          ...track,
          lessons: trackLessons
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (error) {
        console.error('Error fetching track lessons:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch track lessons' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // Placeholder for other API endpoints
    return new Response(JSON.stringify({
      error: 'Not implemented',
      path: url.pathname,
      method: request.method,
      note: 'This endpoint needs to be implemented in the API worker'
    }), {
      status: 501,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  },
};




