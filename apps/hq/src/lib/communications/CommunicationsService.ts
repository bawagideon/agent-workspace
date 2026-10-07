import path from 'path';
import {
  ConversationStore,
  MessageIngestor,
  MessageClassifier,
  AcceptanceConfidenceEvaluator,
  ScopeAnalyzer,
  CommercialPricingEngine,
  DraftManager,
  OutboundAuthorization,
  ChannelDispatcher,
  MockChannelAdapter,
  DealTimelineAggregator
} from '@gideon/runtime';

class CommunicationsService {
  private static instance: CommunicationsService | null = null;

  public store: ConversationStore;
  public ingestor: MessageIngestor;
  public classifier: MessageClassifier;
  public acceptanceEvaluator: AcceptanceConfidenceEvaluator;
  public scopeAnalyzer: ScopeAnalyzer;
  public pricingEngine: CommercialPricingEngine;
  public draftManager: DraftManager;
  public authEngine: OutboundAuthorization;
  public dispatcher: ChannelDispatcher;
  public mockAdapter: MockChannelAdapter;
  public timelineAggregator: DealTimelineAggregator;

  private constructor() {
    const storagePath = process.env.COMMS_STORAGE_PATH ||
      path.resolve(process.cwd(), '.gideon/communications_cache.json');
    const hmacSecret = process.env.HMAC_PLAN_SECRET || 
      process.env.PORTAL_HMAC_SECRET || 
      '53bb94e9745a59b36dfc0d40b5fc4c561467e4118c72cb26e01b68eb7993c187';

    this.store = new ConversationStore(storagePath);
    this.ingestor = new MessageIngestor(this.store);
    this.classifier = new MessageClassifier();
    this.acceptanceEvaluator = new AcceptanceConfidenceEvaluator();
    this.scopeAnalyzer = new ScopeAnalyzer();
    this.pricingEngine = new CommercialPricingEngine();
    this.draftManager = new DraftManager(this.store);
    this.authEngine = new OutboundAuthorization(hmacSecret);
    this.dispatcher = new ChannelDispatcher(this.store);
    this.mockAdapter = new MockChannelAdapter('EMAIL');
    this.dispatcher.registerAdapter(this.mockAdapter);
    this.timelineAggregator = new DealTimelineAggregator(this.store);
  }

  public static getInstance(): CommunicationsService {
    if (!CommunicationsService.instance) {
      CommunicationsService.instance = new CommunicationsService();
    }
    return CommunicationsService.instance;
  }
}

export function getCommunicationsService(): CommunicationsService {
  return CommunicationsService.getInstance();
}
