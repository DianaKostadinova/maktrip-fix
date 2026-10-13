package mk.discovermacedonia.api.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import mk.discovermacedonia.api.client.LanguageModelClient;
import mk.discovermacedonia.api.exception.ModelUnavailableException;
import mk.discovermacedonia.api.model.KnowledgeBase;
import mk.discovermacedonia.api.repository.KnowledgeRepository;
import org.junit.jupiter.api.Test;

class PlannerServiceTest {

    private final LanguageModelClient model = mock(LanguageModelClient.class);
    private final KnowledgeRepository repo = () -> new KnowledgeBase(61.5, List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of());

    @Test
    void comingSoonWhenDisabled_andNeverContactsTheModelServer() {
        var planner = new PlannerService(model, new PromptBuilder(), repo, false);

        assertThatThrownBy(planner::ensureAvailable)
                .isInstanceOf(ModelUnavailableException.class)
                .hasMessageContaining("coming soon");
        verify(model, never()).status();
    }

    @Test
    void checksTheModelWhenEnabled() {
        when(model.status()).thenReturn(new LanguageModelClient.Status(true, true));
        var planner = new PlannerService(model, new PromptBuilder(), repo, true);

        assertThatNoException().isThrownBy(planner::ensureAvailable);
    }
}
