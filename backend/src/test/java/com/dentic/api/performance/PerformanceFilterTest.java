package com.dentic.api.performance;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;
import org.springframework.web.servlet.HandlerMapping;
import static org.junit.jupiter.api.Assertions.*;
class PerformanceFilterTest {
 @Test void writesHeadersWithoutLosingWriterOrStreamBodies() throws Exception {
   for(boolean writer:new boolean[]{true,false}){
     var req=new MockHttpServletRequest("GET","/api/patients/private-id");
     req.setAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE,"/api/patients/{id}");
     var res=new MockHttpServletResponse();
     new PerformanceFilter().doFilter(req,res,(request,response)->{
       if(writer) response.getWriter().write("payload");else response.getOutputStream().write("payload".getBytes());
     });
     assertEquals("payload",res.getContentAsString());assertNotNull(res.getHeader("X-Request-Id"));
     assertTrue(res.getHeader("Server-Timing").contains("dbpool;dur="));assertNull(RequestTiming.CURRENT.get());
   }
 }
}
