package com.dentic.api.performance;
import com.dentic.api.onboarding.domain.Clinic;
import com.dentic.api.patient.domain.*;
import com.dentic.api.patient.web.PatientController;
import com.dentic.api.stock.domain.StockItem;
import com.dentic.api.stock.repository.StockItemRepository;
import com.dentic.api.stock.web.StockController;
import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.web.PageResult;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
@SpringBootTest @Transactional
class PaginationIntegrationTest {
 @Autowired EntityManager em;
 @Autowired StockController stock;
 @Autowired PatientController patients;
 @Autowired StockItemRepository items;
 @AfterEach void clear(){ TenantContext.clear();SecurityContextHolder.clearContext(); }
 @Test void boundedPagesAreStableCompatibleAndTenantIsolated(){
   Clinic clinic=clinic(), foreign=clinic();
   TenantContext.setCurrentTenant(clinic.getId());
   SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(UUID.randomUUID().toString(),null,List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
   Patient patient=patient(clinic), outsider=patient(foreign);
   for(int i=0;i<55;i++) {
     StockItem item=new StockItem();item.setClinic(clinic);item.setName("Same name");item.setCategory("DENTAL");item.setUnit("un");em.persist(item);
     PatientPayment p=new PatientPayment();p.setPatient(patient);p.setAmount(BigDecimal.ONE);em.persist(p);
   }
   StockItem other=new StockItem();other.setClinic(foreign);other.setName("Foreign");other.setCategory("CLINIC");other.setUnit("un");em.persist(other);
   em.flush();
   var first=(PageResult<?>)stock.list(0,null,"","ALL");var next=(PageResult<?>)stock.list(1,null,"","ALL");
   assertEquals(20,first.content().size());assertEquals(55,first.totalElements());assertEquals(3,first.totalPages());
   assertTrue(Collections.disjoint(first.content(),next.content()));
   assertEquals(50,((PageResult<?>)stock.list(0,500,"","ALL")).size());
   assertEquals(0,((PageResult<?>)stock.list(0,20,"Foreign","ALL")).totalElements());
   assertEquals(55,stock.summary().get("total"));assertEquals(55,stock.summary().get("low"));
   assertEquals(55,((List<?>)patients.listPayments(patient.getId(),null,null)).size());
   var page=(PageResult<?>)patients.listPayments(patient.getId(),0,null);
   assertEquals(20,page.content().size());assertEquals(55,page.totalElements());
   assertThrows(IllegalArgumentException.class,()->patients.listPayments(outsider.getId(),0,20));
 }
 private Clinic clinic(){Clinic c=new Clinic();c.setName("Synthetic");c.setPhone("00000000000");c.setEmail(UUID.randomUUID()+"@example.invalid");em.persist(c);return c;}
 private Patient patient(Clinic c){Patient p=new Patient();p.setClinic(c);p.setName("Synthetic");p.setPhone("00000000000");em.persist(p);return p;}
}
