import type { Express } from "express";
import { importRepositoryContent } from "../../scripts/import-repository-content";

export function registerImportRoutes(app: Express) {
  // Import content from GitHub repositories
  app.post('/api/admin/import-repository-content', async (req, res) => {
    try {
      console.log('Starting repository content import...');
      
      const result = await importRepositoryContent();
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Successfully imported content from GitHub repositories',
          data: {
            tracksCreated: result.tracksCreated,
            lessonsImported: result.lessonsImported
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to import repository content',
          error: result.error
        });
      }
    } catch (error: any) {
      console.error('Import route error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during import',
        error: error?.message || 'Unknown error occurred'
      });
    }
  });
}