import { faker } from '@faker-js/faker'
import { type Lab, type LabCategory, type LabStatus } from './schema'

faker.seed(777)

const categories: LabCategory[] = ['Security', 'Networking', 'Development', 'Data Science', 'Cloud Computing']
const statuses: LabStatus[] = ['active', 'maintenance', 'deprecated']

const techPool = ['Linux', 'Windows', 'Docker', 'Python', 'Go', 'React', 'Node.js', 'PostgreSQL', 'MongoDB', 'AWS', 'Azure', 'Wireshark', 'Metasploit', 'Kubernetes']

export const mockLabs: Lab[] = Array.from({ length: 42 }, () => {
  const category = faker.helpers.arrayElement(categories)
  const status = faker.helpers.arrayElement(statuses)
  
  // Pick 2 to 4 random technologies
  const shuffledTech = [...techPool].sort(() => 0.5 - Math.random())
  const technologies = shuffledTech.slice(0, faker.number.int({ min: 2, max: 4 }))

  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName() + ' Environment',
    description: faker.lorem.paragraph(),
    category,
    technologies,
    creditCost: faker.number.int({ min: 5, max: 150 }) * 10, // e.g. 50 to 1500 credits
    durationMinutes: faker.helpers.arrayElement([60, 120, 180, 240, 480]), // 1 to 8 hours
    dockerImage: `registry.vlab.edu/${category.toLowerCase().replace(' ', '-')}/${faker.word.noun()}:latest`,
    environmentConfig: '{\n  "PORT": "8080",\n  "DEBUG": "true",\n  "DB_URL": "internal.db.vlab"\n}',
    instructions: '# Lab Instructions\n\n1. Start the container.\n2. SSH into the terminal.\n3. Execute the payload.',
    status,
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent({ days: 15 }),
  }
})
