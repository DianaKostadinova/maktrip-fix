package mk.discovermacedonia.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.function.Consumer;
import mk.discovermacedonia.api.service.PlannerService;
import mk.discovermacedonia.api.exception.ModelUnavailableException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PlanController.class)
class PlanControllerTest {

    private static final String VALID = """
            {"city":"Ohrid","startDate":"2026-07-10","endDate":"2026-07-12","budgetEur":500,"travelers":2,
             "pace":"relaxed","interests":["History"],"savedPlaces":["Kaneo"],"notes":""}
            """;

    @Autowired
    MockMvc mvc;

    @MockitoBean
    PlannerService planner;

    @Test
    void streamsGeneratedText() throws Exception {
        doAnswer(inv -> {
            Consumer<String> sink = inv.getArgument(1);
            sink.accept("**Day 1**");
            sink.accept(" — Kaneo");
            return null;
        }).when(planner).plan(any(), any());

        var result = mvc.perform(post("/api/plans/stream").contentType(MediaType.APPLICATION_JSON).content(VALID))
                .andExpect(request().asyncStarted())
                .andReturn();

        mvc.perform(asyncDispatch(result))
                .andExpect(status().isOk())
                .andExpect(content().string("**Day 1** — Kaneo"));
    }

    @Test
    void rejectsTripsLongerThanTwoWeeks() throws Exception {
        String tooLong = VALID.replace("2026-07-12", "2026-08-12");

        mvc.perform(post("/api/plans/stream").contentType(MediaType.APPLICATION_JSON).content(tooLong))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid trip details"));
    }

    @Test
    void returns503WhenModelIsDown() throws Exception {
        doThrow(new ModelUnavailableException("Start Ollama")).when(planner).ensureAvailable();

        mvc.perform(post("/api/plans/stream").contentType(MediaType.APPLICATION_JSON).content(VALID))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.detail").value("Start Ollama"));
    }
}
