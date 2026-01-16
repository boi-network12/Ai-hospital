import { MongoClient, Db, ObjectId } from 'mongodb'; 
import { config } from '../config/env';
import { logger } from '../utils/logger';

interface UserMedicalProfile {
  userId: string;
  conditions: string[];
  allergies: string[];
  medications: string[];
  bloodGroup: string;
  genotype: string;
  age: number;
  gender: string;
  location: {
    country: string;
    city?: string;
    state?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface Conversation {
  userId: string;
  query: string;
  response: string;
  type: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

interface SafetyLog {
  validationId: string;
  query: string;
  result: any;
  timestamp: Date;
}

interface UserDocument {
  _id: ObjectId;
  name: string;
  email: string;
  role: string;
  profile?: {
    bloodGroup?: string;
    genotype?: string;
    gender?: string;
    dateOfBirth?: Date | string;
    location?: {
      country?: string;
      city?: string;
      state?: string;
    };
    specialization?: string;
  };
  sessions?: Array<{
    token: string;
    active: boolean;
  }>;
  isDeleted?: boolean;
  roleStatus?: {
    isActive: boolean;
    approvedByAdmin: boolean;
  };
  healthcareProfile?: any;
  isOnline?: boolean;
  lastActive?: Date;
}

// Remove extends Document from interfaces
interface MedicalProfileDocument {
  _id?: ObjectId;
  userId: string;
  conditions: string[];
  allergies: string[];
  medications: string[];
  bloodGroup: string;
  genotype: string;
  age: number;
  gender: string;
  location: {
    country: string;
    city?: string;
    state?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class DatabaseService {
  private client: MongoClient;
  private db: Db | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.client = new MongoClient(config.mongodb.uri);
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.client.connect();
      this.db = this.client.db(config.mongodb.database || 'neuromed-ai');
      this.isConnected = true;
      logger.info('DatabaseService connected to MongoDB');
    } catch (error) {
      logger.error('DatabaseService connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      this.db = null;
      logger.info('DatabaseService disconnected');
    }
  }

  async verifyToken(token: string): Promise<any> {
    try {
      const users = this.db?.collection<UserDocument>('users');
      const user = await users?.findOne({ 
        'sessions.token': token,
        'sessions.active': true
      });

      if (!user) {
        throw new Error('Invalid or expired token');
      }

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile || {}
      };
    } catch (error) {
      logger.error('Token verification error:', error);
      throw error;
    }
  }

  async getUser(userId: string): Promise<UserDocument | null> {
    try {
      const users = this.db?.collection<UserDocument>('users');
      const user = await users?.findOne({ 
        _id: new ObjectId(userId),
        isDeleted: { $ne: true }
      });
      return user ?? null;
    } catch (error) {
      logger.error('Get user error:', error);
      throw error;
    }
  }

  async getUserMedicalProfile(userId: string): Promise<UserMedicalProfile | null> {
    try {
      const medicalProfiles = this.db?.collection<MedicalProfileDocument>('medical_profiles');
      const profile = await medicalProfiles?.findOne({ userId });
      
      if (profile) {
        // Extract only the UserMedicalProfile fields
        const { _id, ...profileData } = profile;
        return profileData;
      }

      // Create default profile if none exists
      const user = await this.getUser(userId);
      
      if (!user) {
        return null;
      }

      const defaultProfile: MedicalProfileDocument = {
        userId,
        conditions: [],
        allergies: [],
        medications: [],
        bloodGroup: user.profile?.bloodGroup || '',
        genotype: user.profile?.genotype || '',
        age: this.calculateAge(user.profile?.dateOfBirth),
        gender: user.profile?.gender || '',
        location: {
          country: user.profile?.location?.country || 'Unknown',
          city: user.profile?.location?.city,
          state: user.profile?.location?.state
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await medicalProfiles?.insertOne(defaultProfile);
      
      // Remove _id from the returned object to match UserMedicalProfile
      const { _id: _, ...profileWithoutId } = defaultProfile;
      return profileWithoutId;
    } catch (error) {
      logger.error('Get medical profile error:', error);
      return null;
    }
  }

  async updateMedicalConditions(userId: string, conditions: string[]): Promise<boolean> {
    try {
      const medicalProfiles = this.db?.collection<MedicalProfileDocument>('medical_profiles');
      
      const result = await medicalProfiles?.updateOne(
        { userId },
        { 
          $set: { 
            conditions,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );

      return result?.modifiedCount === 1 || result?.upsertedCount === 1;
    } catch (error) {
      logger.error('Update medical conditions error:', error);
      throw error;
    }
  }

  async saveConversation(
    userId: string,
    query: string,
    response: any,
    type: string
  ): Promise<void> {
    try {
      const conversations = this.db?.collection<Conversation>('ai_conversations');
      
      const conversation: Conversation = {
        userId,
        query,
        response: typeof response === 'string' ? response : JSON.stringify(response),
        type,
        metadata: {
          responseType: response?.type || 'unknown',
          confidence: response?.confidence || 0,
          timestamp: new Date()
        },
        timestamp: new Date()
      };

      await conversations?.insertOne(conversation);
      
      // Keep only last 100 conversations per user
      await this.cleanupOldConversations(userId);
    } catch (error) {
      logger.error('Save conversation error:', error);
      // Don't throw - conversation logging shouldn't break the flow
    }
  }

  private async cleanupOldConversations(userId: string): Promise<void> {
    try {
      const conversations = this.db?.collection<Conversation>('ai_conversations');
      
      // Count total conversations for this user
      const totalCount = await conversations?.countDocuments({ userId }) || 0;
      
      if (totalCount > 100) {
        // Get the 100th newest conversation
        const hundredthConversation = await conversations
          ?.find({ userId })
          .sort({ timestamp: -1 })
          .skip(99)
          .limit(1)
          .toArray();
        
        if (hundredthConversation && hundredthConversation.length > 0) {
          // Delete conversations older than the 100th one
          await conversations?.deleteMany({
            userId,
            timestamp: { $lt: hundredthConversation[0].timestamp }
          });
        }
      }
    } catch (error) {
      logger.error('Cleanup conversations error:', error);
    }
  }

  async getConversationHistory(userId: string, limit: number = 50): Promise<Conversation[]> {
    try {
      const conversations = this.db?.collection<Conversation>('ai_conversations');
      
      const history = await conversations
        ?.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      return history || [];
    } catch (error) {
      logger.error('Get conversation history error:', error);
      return [];
    }
  }

  async clearConversation(userId: string): Promise<void> {
    try {
      const conversations = this.db?.collection<Conversation>('ai_conversations');
      await conversations?.deleteMany({ userId });
    } catch (error) {
      logger.error('Clear conversation error:', error);
      throw error;
    }
  }

  async findHealthcareProfessionals(filters: {
    specialization?: string;
    location?: string;
    availability?: boolean;
    minRating?: number;
  }): Promise<UserDocument[]> {
    try {
      const users = this.db?.collection<UserDocument>('users');
      
      const query: any = {
        role: { $in: ['doctor', 'nurse'] },
        'roleStatus.isActive': true,
        'roleStatus.approvedByAdmin': true
      };

      if (filters.specialization) {
        query['profile.specialization'] = { $regex: filters.specialization, $options: 'i' };
      }

      if (filters.location) {
        query['$or'] = [
          { 'profile.location.city': { $regex: filters.location, $options: 'i' } },
          { 'profile.location.state': { $regex: filters.location, $options: 'i' } },
          { 'profile.location.country': { $regex: filters.location, $options: 'i' } }
        ];
      }

      if (filters.availability) {
        query['healthcareProfile.availability.isAvailable'] = true;
      }

      if (filters.minRating) {
        query['healthcareProfile.stats.averageRating'] = { $gte: filters.minRating };
      }

      const cursor = users?.find(query)
        .project({
          name: 1,
          email: 1,
          profile: 1,
          healthcareProfile: 1,
          isOnline: 1,
          lastActive: 1
        })
        .limit(20);

      if (!cursor) {
        return [];
      }

      const professionals = await cursor.toArray();
      return professionals as UserDocument[];
    } catch (error) {
      logger.error('Find healthcare professionals error:', error);
      return [];
    }
  }

  async getRestrictedDrugs(): Promise<string[]> {
    try {
      const restrictedDrugs = this.db?.collection<{ name: string }>('restricted_drugs');
      const drugs = await restrictedDrugs?.find().toArray();
      return drugs?.map(d => d.name) || [];
    } catch (error) {
      logger.error('Get restricted drugs error:', error);
      return config.medical.restrictedDrugs;
    }
  }

  async logSafetyCheck(log: SafetyLog): Promise<void> {
    try {
      const safetyLogs = this.db?.collection<SafetyLog>('safety_logs');
      await safetyLogs?.insertOne(log);
    } catch (error) {
      logger.error('Log safety check error:', error);
    }
  }

  private calculateAge(dateOfBirth: Date | string | undefined): number {
    if (!dateOfBirth) return 0;
    
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch {
      return 0;
    }
  }

  // Helper method to get database instance
  getDatabase(): Db {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }
}