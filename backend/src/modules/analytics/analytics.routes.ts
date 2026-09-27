import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/outcomes/summary', authorize('admin', 'provider_admin', 'field_officer'), AnalyticsController.getSummary);
router.get('/provider/:id', authorize('admin', 'provider_admin', 'provider_staff'), AnalyticsController.getProviderMetrics);
router.get('/provider/:id/scorecard', authorize('admin', 'provider_admin'), AnalyticsController.getProviderScorecard);
router.get('/district/:district', authorize('admin', 'field_officer'), AnalyticsController.getDistrictMetrics);
router.get('/equity', authorize('admin'), AnalyticsController.getEquityDisparities);
router.get('/skill-gaps', authorize('admin', 'provider_admin'), AnalyticsController.getSkillGaps);
router.get('/reasons', authorize('admin', 'provider_admin'), AnalyticsController.getReasonsDistribution);
router.get('/data-quality', authorize('admin'), AnalyticsController.getDataQualityHeatmap);
router.get('/advisory-reports', authorize('admin', 'provider_admin'), AnalyticsController.listAdvisoryReports);
router.post('/advisory-reports/generate', authorize('admin'), AnalyticsController.generateAdvisoryReport);

export default router;
