-- Import police stations data from CSV
-- Run this script after creating the police_stations table

INSERT INTO police_stations (name, address, latitude, longitude) VALUES
('Commissariat de Police de Paris 17ème', '19/21 Rue Truffaut, 75017 Paris, France', 48.8851691, 2.322255),
('Préfecture de Police (9ème arrondissement)', '5 Rue de Parme, 75009 Paris, France', 48.881224, 2.3278735),
('Commissariat central de Police', '79-81 Rue de Clignancourt, 75018 Paris, France', 48.8896821, 2.3481684),
('Commissariat central de Police', '1 Av. de Selves, 75008 Paris, France', 48.8668701, 2.3108285),
('Préfecture de Police 8ème arrondissement', '210 Rue du Faubourg Saint-Honoré, 75008 Paris, France', 48.8755977, 2.3041104),
('Caserne Bessières Police Paris', '46 Bd Bessières, 75017 Paris, France', 48.8985856, 2.3227166),
('Commissariat central de Police', '9 Rue Fabert, 75007 Paris, France', 48.8619571, 2.3120335),
('Unité de Police de Quartier 8eme arrondissement', '1 Rue de Lisbonne, 75008 Paris, France', 48.8777778, 2.3179613),
('Commissariat central de police du 15ᵉ', '250 Rue de Vaugirard, 75015 Paris, France', 48.8400472, 2.3024709),
('Le Commissariat de Police', '61 Rue Jean-Jacques Rousseau, 75001 Paris, France', 48.8645625, 2.3443125),
('Police Judiciaire de Paris - Direction régionale', '36 Rue du Bastion, 75017 Paris, France', 48.8935539, 2.3082758),
('Commissariat central de police 5e et 6e', '4 Rue de la Montagne Ste Geneviève, 75005 Paris, France', 48.8494048, 2.3485503),
('Préfecture De Police (Brigade Financière)', '36 Rue du Bastion, 75017 Paris, France', 48.8937145, 2.3081021),
('Commissariat Central du 19ème arrondissement', '3-5 Rue Erik Satie, 75019 Paris, France', 48.8843228, 2.3862388),
('Commissariat de Police Hebert', '32 Rue de l''Évangile, 75018 Paris, France', 48.8934718, 2.364493),
('Police Nationale - D.G.P.N.', '11 Rue des Saussaies, 75008 Paris, France', 48.8713291, 2.3174983),
('Commissariat de Police', '96 Rue Martre, 92110 Clichy, France', 48.9039272, 2.3057253),
('Commissariat de police Centre (1er-4e arr.)', '1 Rue Gabriel Vicaire, 75003 Paris, France', 48.8649972, 2.3615804),
('Commissariat Central 16ème Arrondissement', '62 Av. Mozart, 75016 Paris, France', 48.8542657, 2.2688335),
('Police Nationale', '36 bis Rue Rivay, 92300 Levallois-Perret, France', 48.893713, 2.290154),
('Police Municipale', '65 Rue Martre, 92110 Clichy, France', 48.9030313, 2.3058927),
('Police Municipale', '43 Rue Kléber, 92300 Levallois-Perret, France', 48.8937817, 2.2830352),
('Police station', '15 Rue Dieumegard, 93400 Saint-Ouen-sur-Seine, France', 48.907311, 2.3384659),
('Commissariat de Police', '12 Rue du Château, 92600 Asnières-sur-Seine, France', 48.9067278, 2.2878456),
('Commissariat de Police de Neuilly-sur-seine', '28-34 Rue du Pont, 92200 Neuilly-sur-Seine, France', 48.8877154, 2.2586607),
('Police Station', '19 Av. de la Libération, 92230 Gennevilliers, France', 48.92476, 2.2922292)
ON CONFLICT DO NOTHING;