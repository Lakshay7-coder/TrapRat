"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reasons_taxonomy_1 = require("./reasons.taxonomy");
const reasons_classifier_1 = require("./reasons.classifier");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/taxonomy', (_req, res) => {
    return res.json({ success: true, data: reasons_taxonomy_1.REASONS_TAXONOMY });
});
router.post('/classify', auth_middleware_1.authenticate, (req, res) => {
    const { kind, rawText } = req.body;
    const result = reasons_classifier_1.ReasonClassifier.classify(kind || 'non_placement', rawText || '');
    return res.json({ success: true, data: result });
});
exports.default = router;
