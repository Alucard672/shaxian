package com.shaxian.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shaxian.entity.PrintTemplate;
import com.shaxian.repository.PrintTemplateRepository;
import com.shaxian.util.UuidUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/templates")
public class TemplateController {
    private final PrintTemplateRepository printTemplateRepository;
    private final ObjectMapper objectMapper;

    public TemplateController(
            PrintTemplateRepository printTemplateRepository,
            ObjectMapper objectMapper) {
        this.printTemplateRepository = printTemplateRepository;
        this.objectMapper = objectMapper;
    }


    @GetMapping
    public ResponseEntity<List<PrintTemplate>> getAllTemplates(@RequestParam(required = false) String documentType) {
        if (documentType != null) {
            return ResponseEntity.ok(printTemplateRepository.findByDocumentType(documentType));
        }
        return ResponseEntity.ok(printTemplateRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrintTemplate> getTemplate(@PathVariable String id) {
        return printTemplateRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createTemplate(@RequestBody Map<String, Object> request) {
        try {
            PrintTemplate template = new PrintTemplate();
            template.setId(UuidUtil.generate());
            template.setName((String) request.get("name"));
            if (request.containsKey("type")) {
                template.setType(PrintTemplate.TemplateType.valueOf((String) request.get("type")));
            }
            if (request.containsKey("description")) template.setDescription((String) request.get("description"));
            if (request.containsKey("isDefault")) template.setIsDefault((Boolean) request.get("isDefault"));
            if (request.containsKey("documentType")) {
                template.setDocumentType(PrintTemplate.DocumentType.valueOf((String) request.get("documentType")));
            }
            if (request.containsKey("pageSettings")) {
                template.setPageSettings(objectMapper.writeValueAsString(request.get("pageSettings")));
            }
            if (request.containsKey("titleSettings")) {
                template.setTitleSettings(objectMapper.writeValueAsString(request.get("titleSettings")));
            }
            if (request.containsKey("basicInfoFields")) {
                template.setBasicInfoFields(objectMapper.writeValueAsString(request.get("basicInfoFields")));
            }
            if (request.containsKey("productFields")) {
                template.setProductFields(objectMapper.writeValueAsString(request.get("productFields")));
            }
            if (request.containsKey("summaryFields")) {
                template.setSummaryFields(objectMapper.writeValueAsString(request.get("summaryFields")));
            }
            if (request.containsKey("otherElements")) {
                template.setOtherElements(objectMapper.writeValueAsString(request.get("otherElements")));
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(printTemplateRepository.save(template));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTemplate(@PathVariable String id, @RequestBody Map<String, Object> request) {
        try {
            PrintTemplate template = printTemplateRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("模板不存在"));
            
            if (request.containsKey("name")) template.setName((String) request.get("name"));
            if (request.containsKey("type")) {
                template.setType(PrintTemplate.TemplateType.valueOf((String) request.get("type")));
            }
            if (request.containsKey("description")) template.setDescription((String) request.get("description"));
            if (request.containsKey("isDefault")) template.setIsDefault((Boolean) request.get("isDefault"));
            if (request.containsKey("documentType")) {
                template.setDocumentType(PrintTemplate.DocumentType.valueOf((String) request.get("documentType")));
            }
            if (request.containsKey("pageSettings")) {
                template.setPageSettings(objectMapper.writeValueAsString(request.get("pageSettings")));
            }
            if (request.containsKey("titleSettings")) {
                template.setTitleSettings(objectMapper.writeValueAsString(request.get("titleSettings")));
            }
            if (request.containsKey("basicInfoFields")) {
                template.setBasicInfoFields(objectMapper.writeValueAsString(request.get("basicInfoFields")));
            }
            if (request.containsKey("productFields")) {
                template.setProductFields(objectMapper.writeValueAsString(request.get("productFields")));
            }
            if (request.containsKey("summaryFields")) {
                template.setSummaryFields(objectMapper.writeValueAsString(request.get("summaryFields")));
            }
            if (request.containsKey("otherElements")) {
                template.setOtherElements(objectMapper.writeValueAsString(request.get("otherElements")));
            }
            
            return ResponseEntity.ok(printTemplateRepository.save(template));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable String id) {
        if (!printTemplateRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        printTemplateRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/usage")
    public ResponseEntity<?> incrementUsage(@PathVariable String id) {
        Optional<PrintTemplate> templateOpt = printTemplateRepository.findById(id);
        if (templateOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        PrintTemplate template = templateOpt.get();
        template.setUsageCount(template.getUsageCount() + 1);
        printTemplateRepository.save(template);
        return ResponseEntity.ok(Map.of("usageCount", template.getUsageCount()));
    }
}

