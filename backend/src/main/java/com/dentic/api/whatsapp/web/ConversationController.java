package com.dentic.api.whatsapp.web;
import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/conversations") public class ConversationController { @GetMapping public PageResponse list(@RequestParam(required=false) String status){return new PageResponse(List.of(),0,0,0,20);} public record PageResponse(List<Object> content,int totalPages,int totalElements,int number,int size){} }
