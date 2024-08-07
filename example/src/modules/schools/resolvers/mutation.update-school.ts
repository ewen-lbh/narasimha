import { builder, prisma } from '#lib';
import { SchoolType } from '../index.js';

builder.mutationField('updateSchool', (t) =>
	t.field({
		type: SchoolType,
		args: {
			uid: t.arg.string(),
			name: t.arg.string(),
			address: t.arg.string({ required: false }),
			description: t.arg.string({ required: false }),
			studentMailDomain: t.arg.string(),
			aliasMailDomains: t.arg.stringList(),
		},
		async authScopes(_, {}, { user }) {
			return Boolean(user?.admin);
		},
		async resolve(
			_,
			{
				uid,
				name,
				address,
				description,
				studentMailDomain,
				aliasMailDomains,
			},
			{ user },
		) {
			await prisma.logEntry.create({
				data: {
					area: 'school',
					action: 'update',
					target: uid,
					message: `School ${uid} updated`,
					user: user ? { connect: { id: user.id } } : undefined,
				},
			});
			return prisma.school.update({
				where: { uid },
				data: {
					name,
					address: address ?? undefined,
					description: description ?? undefined,
					studentMailDomain,
					aliasMailDomains,
				},
			});
		},
	}),
);
